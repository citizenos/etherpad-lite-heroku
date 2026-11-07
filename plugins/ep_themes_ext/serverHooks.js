'use strict';

/**
 * Server-side hooks
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_server_side_hooks}
 */

const settingsRaw = require('ep_etherpad-lite/node/utils/Settings');
const getSettings = () => settingsRaw.default || settingsRaw;

const DEFAULT_THEME_STYLES = ['/static/skins/colibris/citizenos.css'];

/**
 * ClientVars hook
 *
 * Exposes plugin settings from settings.json to client code
 * inside clientVars variable to be accessed from client side hooks
 *
 * @param {string} hookName Hook name ("clientVars").
 * @param {object} args Object containing the arguments passed to hook. {pad: {object}}
 * @param {function} cb Callback
 *
 * @returns {*}
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_clientvars}
 */
exports.clientVars = (hookName, args, cb) => {
  const settings = getSettings();
  const pluginSettings = {
    default: DEFAULT_THEME_STYLES,
    'citizenos.com': DEFAULT_THEME_STYLES,
    ...(settings.ep_themes_ext || {}),
  };

  return cb({ ep_themes_ext: pluginSettings });
};
