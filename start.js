#!/usr/bin/env node

const kexec = require('@jcoreio/kexec');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const childProcess = require('child_process');
const log4js = require('log4js');

const logger = log4js.getLogger('start.js');
logger.level = process.env.ETHERPAD_LITE_HEROKU_LOGGER_LEVEL || 'debug';

let settingsLocal = null; // Your local config in '/config/local.json'
let settingsEnv = null; // Settings defined in environment variable 'ETHERPAD_SETTINGS'
let settingsDb = null; // DB settings derived from `DATABASE_URL` variable set by Heroku

logger.info('Checking for config/local.json...');
try {
    settingsLocal = require('./config/local.json');
    logger.info('local.json found!');
} catch (err) {
    logger.info('local.json NOT found!', err)
}

logger.info('Checking for environment variable "ETHERPAD_SETTINGS"...');
if (process.env.ETHERPAD_SETTINGS) {
    try {
        settingsEnv = JSON.parse(process.env.ETHERPAD_SETTINGS);
        logger.info('ETHERPAD_SETTINGS found!');
    } catch (err) {
        logger.error('ETHERPAD_SETTINGS INVALID! Please make sure defined value is a valid JSON string!', err);
        process.exit(1);
    }
} else {
    logger.info('ETHERPAD_SETTINGS NOT found!');
}

if (!settingsLocal && !settingsEnv) {
    logger.error('No configuration provided! You must provide at least one in "/config/local.json" file or "ETHERPAD_SETTINGS" environment variable.');
    process.exit(1);
}

// Lets see if Herokus default DATABASE_URL is set in the ENV and override DB settings
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
    logger.info('Overriding database configuration from DATABASE_URL!');

    settingsDb = {};
    settingsDb.dbType = databaseUrl.split(':')[0];
    settingsDb.dbSettings = databaseUrl + '?ssl=true';
}

logger.info('Mergeing config/local.json and "ETHERPAD_SETTINGS" configuration...');
const settings = _.merge(settingsLocal || {}, settingsEnv || {}, settingsDb || {});

if (typeof settings.dbSettings === 'string') { // TODO: Remove IF this is fixed: https://github.com/ether/etherpad-lite/issues/4985
    logger.info('DB configuration seems to be a string, parsing it into object. See  https://github.com/ether/etherpad-lite/issues/4985');

    const dbSettingsString = settings.dbSettings;
    let dbSettingsObject = null;

    let [url, params] = dbSettingsString.split('?');
    const matches = url.match(/^(?<type>.*?):\/\/(?<user>.*?)\:(?<password>.*?)@(?<host>.*?)\:(?<port>.*=?)\/(?<database>[^?]*)/);

    if (matches && matches.groups) {
        dbSettingsObject = matches.groups;
        //Url params
        if (params) {
            const urlSearchParams = new URLSearchParams(params);
            urlSearchParams.forEach(function (value, key) {
                dbSettingsObject[key] = value;
            });
        }
        settings.dbType = dbSettingsObject.type;
        settings.dbSettings = dbSettingsObject;
    } else {
        logger.error('Invalid DB connection string provided as "dbSettings"', settingsDb.dbSettings);
        process.exit(1);
    }
}

logger.info('Effective configuration is:\n', JSON.stringify(settings, null, 2));

logger.info('\nWrite the Etherpad API key to the disk from the ENV "ETHERPAD_API_KEY" or local.json "___apiKey"...');
const etherpadApiKey = process.env.ETHERPAD_API_KEY || settings.___apiKey;
if (etherpadApiKey) {
    logger.info('ETHERPAD_API_KEY found!');
    fs.writeFileSync('./etherpad-lite/APIKEY.txt', etherpadApiKey);
    delete settings.___apiKey; // Remove from effective conf so that Etherpad startup does not show warnings about unknown keys
} else {
    logger.info('ETHERPAD_API_KEY NOT found!');
}

logger.info('\nWrite the Etherpad session key to the disk from the ENV "ETHERPAD_SESSION_KEY" or local.json "___sessionKey"...');
const etherpadSessionKey = process.env.ETHERPAD_SESSION_KEY || settings.___sessionKey;
if (etherpadSessionKey) {
    logger.info('ETHERPAD_SESSION_KEY found!');
    fs.writeFileSync('./etherpad-lite/SESSIONKEY.txt', etherpadSessionKey);
    delete settings.___sessionKey; // Remove from effective conf so that Etherpad startup does not show warnings about unknown keys
} else {
    logger.info('ETHERPAD_SESSION_KEY NOT found!');
}
childProcess.execSync('npm i pnpm --global');
logger.info('\nFind plugin configuration from effective settings...');
childProcess.execSync('cd etherpad-lite', {stdio: [0, 1, 2]});

logger.info('Installing plugins...');
Object.keys(settings).forEach(function (key) {
    if (key.match(/ep_/)) {
        const version = settings[key].___version;
        if (version) {
            childProcess.execSync('pnpm --filter bin run plugins i '+ key + '@' + version, {stdio: [0, 1, 2]});
            //pluginInstallCommand += ' ' + key + '@' + version;
            delete settings[key].___version; // Remove from effective conf so that Etherpad startup does not show warnings about unknown keys
        } else {
            logger.error('WARN! Missing version configuration (___version) for plugin "' + key + '". Ignoring!');
        }
    }
});
childProcess.execSync('cd ..', {stdio: [0, 1, 2]});
//childProcess.execSync(pluginInstallCommand, {stdio: [0, 1, 2]});
//childProcess.execSync('./installPackages.sh', {stdio: [0, 1, 2]});

const pathSettings = path.resolve('./etherpad-lite/settings.json');
logger.info('\nWrite settings.json file which is read by EP to ' + pathSettings);
try {
    fs.writeFileSync(pathSettings, JSON.stringify(settings, null, 2));
    logger.info('Settings.json written to ' + pathSettings);
} catch (err) {
    logger.error('Settings.json write FAILED to ' + pathSettings, err);
    process.exit(1);
}
logger.info('Configuration done! \n');
logger.info(__dirname+'\n');
// Run the Etherpad itself. Using kexec so that the current process would get replaced with the new one
if (process.env.ETHERPAD_ALLOW_ROOT) {
    kexec('./etherpad-lite/bin/run.sh --root');
    kexec('kill node');
    kexec('node --optimize_for_size --max_old_space_size=460 --gc_interval=100 ./etherpad-lite/node_modules/ep_etherpad-lite/node/server.js ');
} else {
    kexec('./etherpad-lite/bin/run.sh');
    kexec('kill node');
    kexec('node --optimize_for_size --max_old_space_size=460 --gc_interval=100 ./etherpad-lite/node_modules/ep_etherpad-lite/node/server.js ');
}

