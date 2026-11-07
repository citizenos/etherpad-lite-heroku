'use strict';

const PLUGIN_NAME = 'ep_auth_citizenos';

const jwt = require('jsonwebtoken');
const request = require('superagent');
const cors = require('cors');

const settingsRaw = require('ep_etherpad-lite/node/utils/Settings');
const getSettings = () => settingsRaw.default || settingsRaw;
const getPluginSettings = () => getSettings()[PLUGIN_NAME] || {};

const dbMod = require('ep_etherpad-lite/node/db/DB');
const db = (dbMod.default || dbMod).db || dbMod.db;
const apiMod = require('ep_etherpad-lite/node/db/API');
const API = apiMod.default || apiMod;
const authorManagerMod = require('ep_etherpad-lite/node/db/AuthorManager');
const authorManager = authorManagerMod.default || authorManagerMod;

let log4js;
try {
    log4js = require('ep_etherpad-lite/node_modules/log4js');
} catch {
    log4js = require('log4js');
}
const logger = (log4js.default || log4js).getLogger(PLUGIN_NAME);

const rsRaw = require('ep_etherpad-lite/node/utils/randomstring');
const randomString = rsRaw.default || rsRaw;

// Permission cache
const permissionCache = {};

/**
 * Get Etherpad key for token to author mapping
 *
 * @param {string} token EP token
 *
 * @returns {string} Database key
 *
 * @private
 */
const _getDbKeyForToken = (token) => `token2author:${token}`;


/**
 * Find out Topic ID from the Pad url.
 *
 * If it's a Pad in edit mode, the Pad ID === Topic ID
 * If it's a read-only Pad link, the Topic ID is looked up from read-only ID
 *
 * @param {object} req Express Request object
 *
 * @returns {void}
 *
 * @private
 */
const _handleTopicInfo = async (req) => {
    // Pad name === topicId, lets try to get it from the url
    const matches = req.path.match(/\/p\/([\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12})/);
    if (matches && matches.length > 1) {
        req.session.topic = {
            id: matches[1]
        };

        return true;
    }

    // Must be read-only pad, let's find Pad id from read-only ID
    const roMatches = req.path.match(/\/p\/(r\.[\w]*)/);
    if (roMatches && roMatches.length > 1) {
        const roId = roMatches[1];
        try {
            const padIDResult = await API.getPadID(roId);

            req.session.topic = {
                id: padIDResult.padID
            };

            return true;
        } catch (err) {
            logger.error(err);
        }
    } else {
        logger.warn('Was not able to find Topic id for path', req.path);
        delete req.session.topic;

        return true;
    }
};

/**
 * Citizen OS sends JWT in query that provides user info
 * @param req
 * @private
 */
const _readJWT = (req) => {
    const pluginSettings = getPluginSettings();
    // JSON Web Token (JWT) passed by CitizenOS
    const token = req.query.jwt;

    // Initial request, the Pad is first opened with JWT
    if (token) {
        try {
            return jwt.verify(token, pluginSettings.jwt.publicKey, { algorithms: pluginSettings.jwt.algorithms });
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                // It's ok when for example navigating from timeline view back to Pad.
                // It calls history back, thus
                // FIXME: That just makes token expiry pointless anyway..
                logger.info('JWT verification failed', err, req.path);

                return;
            }
            logger.error('JWT verification failed', err, req.path);

            return;
        }
    }

    logger.debug('No JWT provided');
};

/**
 * Get Topic permission level
 *
 * Cache is not used when there is no "userId" as for these cases only authorization really c
 *
 * @param {string} topicId Topic id
 * @param {string|null} userId User id, can be null.
 * @param {boolean} ignoreCache Ignore cache and always call API
 *
 * @returns {Promise<string|*>}
 *
 * @private
 */

const _getTopicPermissions = async (topicId, userId, ignoreCache) => {
    if (!topicId) {
        logger.debug('_getTopicPermissions', 'No Topic ID provided.');

        return 'none';
    }

    const pluginSettings = getPluginSettings();
    const authorizationUrl = pluginSettings.authorization.url;
    const cacheMaxAge = pluginSettings.authorization.cacheMaxAge;
    const apiKey = pluginSettings.authorization.apiKey;
    const caCert = pluginSettings.authorization.caCert;

    const path = authorizationUrl.replace(':topicId', topicId);

    const query = {};

    if (userId) {
        query.userId = userId;
    }

    let cacheKey;

    // If there is no userId, there is no caching.
    // It is not needed as the handleMessage authorization for messages which have userId
    if (!ignoreCache && topicId && userId) {
        cacheKey = `${topicId}$${userId}`;
    }

    // Check for cache, no cache if there is no userId.
    if (cacheKey) {
        const cacheValue = permissionCache?.[cacheKey]?.value;
        const cacheTimestamp = permissionCache?.[cacheKey]?.timestamp;

        if (cacheTimestamp && (cacheTimestamp + cacheMaxAge > new Date().getTime())) {
            logger.debug('_getTopicPermissions', 'Cache hit for key', cacheKey);

            return cacheValue;
        } else {
            logger.debug('_getTopicPermissions', 'Cache miss for key', cacheKey);
        }
    }

    const req = request.get(path);
    if (caCert) {
        req.ca(caCert);
    }

    try {
        const res = await req
            .set('X-API-KEY', apiKey)
            .query(query);

        const level = res?.body?.data?.level;
        if (!level) {
            logger.error('Authorization API did not return permission level. Access denied!', res.body);

            return 'none';
        }

        // Add result to cache
        if (cacheKey) {
            logger.debug('Refresh cache!', cacheKey);
            permissionCache[cacheKey] = {
                value: level,
                timestamp: new Date().getTime()
            };
        }

        return level;
    } catch (err) {
        if (err) {
            logger.error('Authorization API returned an error. Access denied!', err);

            return 'none';
        }
    }
};

/**
 * loadSettings hook
 *
 * Using it to verify plugin configuration, will kill the whole process if the conf is wrong.
 *
 * @returns {void}
 *
 * @see {@link http://etherpad.org/doc/v1.8.13/#index_loadsettings}
 */
exports.loadSettings = async (hook, context) => {
    const pluginSettings = context?.settings?.[PLUGIN_NAME] || getPluginSettings();
    const authorizationUrl = pluginSettings?.authorization?.url;
    const cacheMaxAge = pluginSettings?.authorization?.cacheMaxAge;
    const apiKey = pluginSettings?.authorization?.apiKey;

    if (!authorizationUrl || !cacheMaxAge || !Number.isFinite(cacheMaxAge) || !apiKey) {
        const invalidConfErr = `Invalid configuration! Missing authorization.url or authorization.cacheMaxAge or authorization.apiKey! Please check EP settings.json.`;
        logger.error(invalidConfErr, pluginSettings);
        throw new Error(invalidConfErr);
    }

    const caCert = pluginSettings?.authorization?.caCert;
    if (caCert) {
        if (caCert.indexOf('-----BEGIN CERTIFICATE-----') !== 0) {
            const invalidCertErr = `Invalid configuration! If you provide authorization.caCert, make sure it looks like a cert.`;
            logger.error(invalidCertErr);
            throw new Error(invalidCertErr);
        }
    }

    const jwtPublicKey = pluginSettings?.jwt?.publicKey;
    if (!jwtPublicKey || jwtPublicKey.indexOf('PUBLIC KEY') < 0) {
        const missingJWTpubKey = `Invalid configuration! Missing JWT public key (ep_auth_citizenos.jwt.publicKey)! Please check your EP settings.json.`;
        logger.error(missingJWTpubKey, pluginSettings);
        throw new Error(missingJWTpubKey);
    }

    const jwtAlgorithms = pluginSettings?.jwt?.algorithms;
    if (!jwtAlgorithms || !Array.isArray(jwtAlgorithms)) {
        const missingJWTAlgo = `Invalid configuration! Missing JWT algorithm (ep_auth_citizenos.jwt.algorithms)! Please check your EP settings.json`;
        logger.error(missingJWTAlgo, pluginSettings);
        throw new Error(missingJWTAlgo);
    }

    const apiCorsOptions = pluginSettings?.api?.cors;

    if (apiCorsOptions?.origin) {
        logger.info('Handling CORS origin as RegExp!');

        if (!Array.isArray(apiCorsOptions.origin)) {
            apiCorsOptions.origin = [apiCorsOptions.origin];
        }
        apiCorsOptions.origin.forEach(function (pattern, i) {
            if (!(pattern instanceof RegExp)) {
                apiCorsOptions.origin[i] = new RegExp(pattern, 'i');
            }
        });

        logger.debug('API CORS options OK', apiCorsOptions);
    }
};

exports.expressCreateServer = (hook, { app }) => {
    logger.debug(hook);

    /**
     * Logout from EP - destroy the EP session.
     *
     * Originally designed for Citizen OS FE to call on User logout to guarantee that no EP session is left behind in the User browser.
     * When FE call to this fails, FE MUST inform User and NOT log out from Citizen OS either so that User knows that the session has NOT been destroyed.
     *
     * When API and EP were on the same domain, API /logout could unset the cookies, but that is not the case any more.
     */

    const pluginSettings = getPluginSettings();
    let corsOptions = {};
    if (pluginSettings?.api?.cors) {
        corsOptions = { ...pluginSettings.api.cors };
        if (Array.isArray(corsOptions.origin)) {
            corsOptions.origin = corsOptions.origin.map((pattern) =>
                pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i')
            );
        }
    }
    app.get('/ep_auth_citizenos/logout', cors(corsOptions), (req, res) => {
        logger.debug(req.method + ' ' + req.path, 'host', req.get('host'), 'origin', req.get('origin'));

        return req.session.destroy((err) => {
            if (err) {
                logger.error('Failed to log out', err);
                return res.status(500).send('Internal server error');
            }

            res.clearCookie('token');
            res.clearCookie('express_sid');

            return res.json({ message: 'OK', status: 200 });
        });
    });
};

exports.preAuthorize = (hook, { req }) => {
    logger.debug(hook);

    const staticPathsRE = new RegExp(`^/(?:${[
        'api/.*',
        'ep_auth_citizenos/logout',
        'favicon\\.ico',
        'health',
        'javascripts/.*',
        'locales\\.json',
        'locales/.*\\.json',
        'manifest\\.json',
        'padbootstrap-.*\\.min\\.js',
        'pluginfw/.*',
        'static/.*'
    ].join('|')})$`);

    if (req.path.match(staticPathsRE)) return true; // Allow access, next handlers are skipped

    return; // This should delegate access handling to next handlers..
};

exports.authenticate = async (hook, { req, users }) => {
    logger.debug(hook);

    if (!users) {
        users = {};
    }

    // Skip authorization for some paths...
    if (req.path.match(/^\/(jserror|favicon|locales|static|javascripts|pluginfw|api|health)/)) {
        return true;
    }

    logger.debug('authorize', req.path, req.query);

    // See if handover is done using JWT. We get username from there, if it exists.
    // Sets the req.session.user if JWT is valid
    const tokenPayload = _readJWT(req);
    const userId = tokenPayload?.user?.id;

    if (userId) {
        logger.debug('JWT payload was fine.', tokenPayload);

        req.session.user = tokenPayload.user;
        users[req.session.user.name] = req.session.user;

        return true;
    } else if (req.session?.user?.id) {
        logger.debug('Using existing authenticated session user.', req.session.user);
        users[req.session.user.name] = req.session.user;

        return true;
    } else {
        logger.error('JWT payload is missing required data.', tokenPayload);
    }

    return false;
};

/**
 * authorize hook
 *
 * @param {string} hook "authorize"
 * @param {object} context Context
 * @param {function} cb Function cb([thouShallPass])
 * where thouShallPass is true or false depending if authorized or not.
 *
 * @returns {Promise<boolean|*|Response>}
 *
 * @see {@link https://etherpad.org/doc/v1.8.13/#index_authorize}
 */

exports.authorize = async (hook, { req, res }) => {
    logger.debug(hook, 'session', req.session, 'cookies', req.cookies, 'path', req.path, 'params', req.params, 'query', req.query);

    // Parse Topic info from the request and store it in session.
    await _handleTopicInfo(req);

    // Handover has completed and from here on we check for permissions by calling Citizen OS API.
    // This is to ensure that if permissions change in Citizen OS system, we act accordingly in EP
    const topicId = req.session?.topic?.id;
    const userId = req.session?.user?.id;
    // userId may be null, it's ok for a public Topic
    if (!topicId) {
        return false;
    }

    const lvl = await _getTopicPermissions(topicId, userId, true);

    // Citizen OS wants 1:1 Citizen OS userId to EP authorID mapping. We also want login from single user+location - https://github.com/citizenos/citizenos-fe/issues/676
    if (lvl && userId && req.session?.user) {
        // Create or find an author for Citizen OS user ID.
        const resAuthor = await authorManager.createAuthorIfNotExistsFor(userId, req.session.user.name);
        const userAuthorId = resAuthor.authorID;

        // Create token in DB with our already existing author.
        const token = `t.${randomString(20)}`;
        await db.set(`token2author:${token}`, userAuthorId);

        // TODO: Ideally would like to skip IF author is already set on Citizen OS side. As the "createAuthorIfNotExistsFor" does not return info on if the author already existed, there is more work
        await _syncAuthorData({
            userId,
            authorID: userAuthorId
        });

        const settings = getSettings();
        const isSecure = Boolean(req.secure || req.headers?.['x-forwarded-proto'] === 'https' || settings.ssl);

        // Send cookie with "token", note that in original EP implementation FE generates the "token".
        res.cookie('token', token, {
            path: '/',
            expires: 0, // Session cookie
            httpOnly: false, // EP FE JS wants to read this
            secure: isSecure,
            sameSite: isSecure ? 'none' : 'lax'
        });
    }

    if (['admin', 'edit'].indexOf(lvl) > -1) { // User has edit permissions
        logger.debug('authorize', 'User has edit permissions as the level is', lvl, 'Access granted!');

        return true;
    } else if (lvl === 'read') { // User has read-only
        logger.debug('authorize', 'User read permissions as the level is', lvl, 'Access granted! READONLY');

        // Set the custom header for CitizenOS API tests to know that plugin did enforce read-only mode.
        res.set('X-EP-AUTH-CITIZENOS-AUTHORIZE', 'readonly');

        return 'readOnly'; //As per - https://etherpad.org/doc/v1.8.13/#index_authorize
    } else { // User has no permissions
        logger.warn('User has no permissions to access the Pad. Access denied!');

        return false;
    }
};

/**
 * Auth failure hook
 *
 * This hook is called to handle a pre-authentication authorization failure.
 * A plugin's preAuthzFailure function is only called if the pre-authentication authorization failure was not already handled by a preAuthzFailure function from another plugin.
 *
 * @param {string} hook Hook name "authFailure"
 * @param {object} context {req, res, next}
 * @param {function} cb callback
 *
 * @returns {Promise<boolean>}
 *
 * @see {@link http://etherpad.org/doc/v1.8.13/#index_authzfailure}
 */

exports.authzFailure = (hook, { res }) => {
    logger.debug(hook);

    res.status(403).send('Authentication required');

    return true;
};

/**
 * Auth failure hook
 *
 * This hook is called to handle an authentication failure.
 * Plugins that supply an authenticate function should probably also supply an authnFailure function unless falling back to HTTP basic authentication is appropriate upon authentication failure.
 * A plugin's authnFailure function is only called if the authentication failure was not already handled by an authnFailure function from another plugin.
 *
 * @param {string} hook Hook name "authnFailure"
 * @param {object} context {req, res, next}
 *
 * @returns {boolean}
 *
 * @see https://etherpad.org/doc/v1.8.13/#index_authnfailure
 */
exports.authnFailure = (hook, { res }) => {
    logger.debug(hook);

    res.status(401).send('Authentication required');

    return true;
};

const _syncAuthorData = async (authorData) => {
    const pluginSettings = getPluginSettings();
    const caCert = pluginSettings?.authorization?.caCert;
    const authorSyncUrl = pluginSettings?.authorSync?.url;
    const apiKey = pluginSettings?.authorization?.apiKey;
    if (!authorSyncUrl) return;

    const path = authorSyncUrl.replace(':userId', authorData.userId);
    const req = request.put(path);

    if (caCert) {
        req.ca(caCert);
    }
    try {
        await req
            .set('X-API-KEY', apiKey)
            .send(authorData);
    } catch (err) {
        logger.error(err);
    }
};
/**
 * handleMessage hook
 *
 * @param {string} hook "handleMessage"
 * @param {object} context Context
 *
 * @returns {void}
 *
 * @see {@link http://etherpad.org/doc/v1.8.13/#index_handlemessage}
 */
exports.handleMessage = async (hook, { socket, message }) => {
    logger.debug(hook, 'session', socket.client.request.session, 'message', message);

    // All other messages have to go through authorization
    const session = socket.client.request.session;
    const topicId = session?.topic?.id;
    const userId = session?.user?.id;

    // Disable editing user info
    if (message.type === 'COLLABROOM' && message.data.type === 'USERINFO_UPDATE') {
        logger.debug('handleMessage', 'Not allowing USERINFO_UPDATE update, don\'t want users changing their names.');

        return [null];
    }

    if (!topicId) {
        logger.debug('handleMessage', 'Message dropped cause there is no session info');
        socket.json.send({ accessStatus: 'deny' });

        return [null];
    }

    if (message.type !== 'CLIENT_READY') { // ALL BUT 'CLIENT_READY' require authorization.
        const level = await _getTopicPermissions(topicId, userId, false);

        if (['admin', 'edit'].indexOf(level) > -1) {
            return [message];
        } else if (level === 'read' && message.type === 'CHANGESET_REQ') {
            // Changeset requests are allowed for read level
            return [message];
        } else {
            logger.debug('handleMessage', 'User is not allowed to post to this pad. The level was', level, 'Access denied!');
            // Send deny message, so that UI would throw "no permissions" error
            socket.json.send({ accessStatus: 'deny' });

            return [null];
        }
    }
};

/**
 * userLeave hook
 *
 * NOTE: Runs SYNC in EP.
 *
 * @param {string} hook "userLeave"
 * @param {object} session Session info
 *
 * @returns {void}
 *
 * @see {@link http://etherpad.org/doc/v1.8.13/#index_userleave}
 */
exports.userLeave = (hook, session) => {
    logger.debug(hook, session, session.id);

    // Delete the token from DB
    const token = session?.auth?.token;
    if (token) {
        // Cleanup DB from the token,
        // as we generate a new one on each authorization, there would be a lot
        db.remove(_getDbKeyForToken(token)); // NOTE: Runs async, but "userLeave" hook itself is expected to be sync. It's ok tho, it is just best effort cleanup.
    } else {
        logger.warn('userLeave', 'Wanted to clean up DB but no token was present!', token);
    }
};
