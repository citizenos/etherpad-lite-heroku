'use strict';

const PLUGIN_NAME = 'ep_webhooks';
const debounce = require('lodash.debounce');
const request = require('superagent');
const settingsRaw = require('ep_etherpad-lite/node/utils/Settings');
const getSettings = () => settingsRaw.default || settingsRaw;

let pluginSettings; // set with loadSettings hook
let changedPads = {}; // Pads that have changed. key = padId, value = array of user change entries

const getPluginSettings = () => pluginSettings || getSettings()?.[PLUGIN_NAME];

/**
 * Call the webhooks
 *
 * The ``debounce`` is used to delay execution.
 *
 * @see {@link https://lodash.com/docs#debounce}
 */
const callPadUpdateWebhooks = debounce(() => {
  const activeSettings = getPluginSettings();
  console.log('callPadUpdateWebhooks', changedPads);

  // No pads changed
  if (!Object.keys(changedPads).length) {
    return;
  }

  const changedPadIds = changedPads;

  const padIds = Object.keys(changedPadIds);
  padIds.forEach((padId) => {
    changedPadIds[padId].forEach((user) => {
      delete user.author;
    });
  });
  changedPads = {};

  const updateHooksToCall = activeSettings?.pads?.update;
  if (Array.isArray(updateHooksToCall)) {
    // Fire and forget - no guarantees of delivery for now
    updateHooksToCall.forEach((path) => {
      const req = request.post(path);

      // The support for self signed certificates
      const caCert = activeSettings.caCert;
      if (caCert) {
        req.ca(caCert);
      }

      req.set('X-API-KEY', activeSettings.apiKey);
      req.send({ pads: changedPadIds });
      req.end((err) => {
        if (err) {
          console.error(
            `callPadUpdateWebhooks - HTTP POST failed to ${path}. Error was: ${err}`,
          );
        }
      });
    });
  }
}, 1000, { maxWait: 5000 });

/**
 * handleMessage hook
 *
 * @param {string} hook_name
 * @param {object} context
 * @param {Function} cb Callback
 *
 * @see {@link http://etherpad.org/doc/v1.8.14/#index_handlemessage}
 */
exports.handleMessage = async (hook, { message, sessionInfo, socket }) => {
  const activeSettings = getPluginSettings();
  if (activeSettings) {
    const messageType = message?.data?.type;
    if (messageType === 'USER_CHANGES') {
      const user = socket?.client?.request?.session?.user;
      if (!user?.id) {
        return;
      }
      const ip = socket?.client?.request?.ip;
      const rev = message.data.baseRev;
      const padId = sessionInfo?.padId;
      const author = sessionInfo?.author;
      if (padId) {
        if (changedPads[padId]) {
          const userIndex = changedPads[padId].findIndex((e) => e.userId === user.id);
          if (userIndex > -1) {
            changedPads[padId].splice(userIndex, 1);
          }
        } else {
          changedPads[padId] = [];
        }
        changedPads[padId].push({
          userId: user.id,
          author,
          rev,
          ip
        });
      } else {
        console.log('handleMessage', 'Pad changed, but no padId!');
      }
    }
  }
};

/**
 * loadSettings
 *
 * @param {string} hook_name "loadSettings"
 * @param {object} args Object {settings: {object}}
 *
 * @see {@link http://etherpad.org/doc/v1.8.14/#index_loadsettings}
 */
exports.loadSettings = async (hook, args) => {
  const settings = args?.settings || getSettings();
  if (settings?.[PLUGIN_NAME]) {
    pluginSettings = settings[PLUGIN_NAME];

    const caCert = pluginSettings.caCert;
    if (caCert) {
      if (caCert.indexOf('-----BEGIN CERTIFICATE-----') !== 0) {
        const message = `Invalid configuration! If you provide caCert,
        make sure it looks like a cert.`;
        console.error(message);
        throw new Error(message);
      }
    }
  }
};

exports.padUpdate = async (hook, { pad, authorId }) => {
  if (pad?.id && changedPads[pad.id]?.length) {
    changedPads[pad.id].forEach((entry, key) => {
      if (!entry.author || entry.author === authorId) {
        changedPads[pad.id][key].rev = pad.head;
      }
    });
    callPadUpdateWebhooks();
  }
};

exports.userLeave = async () => {
  callPadUpdateWebhooks();
};
