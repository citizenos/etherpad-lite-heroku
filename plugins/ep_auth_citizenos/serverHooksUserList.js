'use strict';

const eejs = require('ep_etherpad-lite/node/eejs/');

/**
 * padInitToolbar hook
 *
 * Add a button to the toolbar
 *
 * @param {string} hookName Hook name
 * @param {object} args Arguments
 * @param {method} cb Callback
 *
 * @returns {void}
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_padinittoolbar}
 */
exports.padInitToolbar = (hookName, args, cb) => {
  const toolbar = args.toolbar;

  const button = toolbar.button({
    command: 'epCitizenOSUserListToggle',
    localizationId: 'pad.toolbar.showusers.title', // Reusing existing translations
    class: 'buttonicon buttonicon-showusers epCitizenOSUserListToggle',
  });

  toolbar.registerButton('epCitizenOSUserListToggle', button);

  return cb();
};

/**
 * eejsBlock_afterEditbar hook
 *
 * Add user list template to the DOM
 *
 * @param {string} hookName Hook name
 * @param {object} args Arguments
 * @param {function} cb Callback
 *
 * @returns {void}
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_eejsblock_name}
 */

exports.eejsBlock_afterEditbar = (hookName, args, cb) => {
  args.content += eejs.require('ep_auth_citizenos/templates/userList.ejs');

  return cb();
};

/**
 * eejsBlock_styles hook
 *
 * Add plugin stylesheet to the DOM
 *
 * @param {string} hookName Hook name
 * @param {object} args Arguments
 * @param {function} cb Callback
 *
 * @returns {void}
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_eejsblock_name}
 */
exports.eejsBlock_styles = (hookName, args, cb) => {
  args.content += eejs.require('ep_auth_citizenos/templates/userListStylesheets.ejs');

  return cb();
};
