#!/usr/bin/env node

'use strict';

/**
 * Heroku Prebuild script
 *
 * @see https://devcenter.heroku.com/articles/nodejs-support#heroku-specific-build-steps
 */

var fs = require('fs');
var _ = require('./libs/lodash.custom');

var settingsLocal = null; // Your local config in '/config/local.json'
var settingsEnv = null; // Settings defined in environment variable 'ETHERPAD_SETTINGS'
var settingsDb = null; // DB settings derived from `DATABASE_URL` variable set by Heroku

console.log('Checking for config/local.json...');
try {
    settingsLocal = require('./config/local.json');
    console.log('local.json found!');
} catch (err) {
    console.log('local.json NOT found!')
}

console.log('Checking for environment variable "ETHERPAD_SETTINGS"...');
if (process.env.ETHERPAD_SETTINGS) {
    try {
        settingsEnv = JSON.parse(process.env.ETHERPAD_SETTINGS);
        console.log('ETHERPAD_SETTINGS found!');
    } catch (err) {
        console.error('ETHERPAD_SETTINGS INVALID! Please make sure defined value is a valid JSON string!', err);
    }
} else {
    console.log('ETHERPAD_SETTINGS NOT found!');
}

if (!settingsLocal && !settingsEnv) {
    console.error('No configuration provided! You must provide at least one in "/config/local.json" file or "ETHERPAD_SETTINGS" environment variable.');
    process.exit(1);
}

// Lets see if Herokus default DATABASE_URL is set in the ENV and override DB settings
var databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
    console.log('Overriding database configuration from DATABASE_URL!');

    settingsDb = {};
    settingsDb.dbType = databaseUrl.split(':')[0];
    settingsDb.dbSettings = databaseUrl + '?ssl=true';
}

console.log('Mergeing config/local.json and "ETHERPAD_SETTINGS" configuration...');
var settings = _.merge(settingsLocal || {}, settingsEnv || {}, settingsDb || {});

console.log('Effective configuration is:\n', JSON.stringify(settings, null, 2));

console.log('\nFind plugin configuration from effective settings...');
var plugins = {}; // Plugin configuration to be copied to package.json
Object.keys(settings).forEach(function (key) {
    if (key.match(/ep_/)) {
        var version = settings[key].___version;
        if (version) {
            plugins[key] = version;
        } else {
            console.warn('WARN! Missing version configuration (___version) for plugin "' + key + '". Ignoring!');
        }
    }
});

console.log('Final plugin list\n', JSON.stringify(plugins, null, 2));
console.log('Adding final plugin list to package.json...');

var packageOriginal = require('./package.json');
var packageNew = JSON.parse(JSON.stringify(packageOriginal)); // Clone original
_.merge(packageNew.dependencies, plugins);

console.log('New package json:\n', JSON.stringify(packageNew, null, 2));

try {
    fs.writeFileSync('./package.json.backup', JSON.stringify(packageOriginal, null, 2));
    fs.writeFileSync('./package.json', JSON.stringify(packageNew, null, 2));
    console.log('New package.json written.')
} catch (err) {
    console.error('Failed to write new package.json', err);
    process.exit(1);
}

console.log('\nWrite the Etherpad API key to the disk from the ENV "ETHERPAD_API_KEY" or local.json "___apiKey"...');
var etherpadApiKey = process.env.ETHERPAD_API_KEY || settings.___apiKey;
if (etherpadApiKey) {
    console.log('ETHERPAD_API_KEY found!');
    fs.writeFileSync('./etherpad-lite/APIKEY.txt', etherpadApiKey);
} else {
    console.log('ETHERPAD_API_KEY NOT found!');
}

console.log('\nWrite the Etherpad session key to the disk from the ENV "ETHERPAD_SESSION_KEY" or local.json "___sessionKey"...');
var etherpadSessionKey = process.env.ETHERPAD_SESSION_KEY || settings.___sessionKey;
if (etherpadSessionKey) {
    console.log('ETHERPAD_SESSION_KEY found!');
    fs.writeFileSync('./etherpad-lite/SESSIONKEY.txt', etherpadSessionKey);
} else {
    console.log('ETHERPAD_SESSION_KEY NOT found!');
}

console.log('\nWrite settings.json file which is read by EP...');
try {
    fs.writeFileSync('./etherpad-lite/settings.json', JSON.stringify(settings, null, 2));
    console.log('Settings.json written "./etherpad-lite/settings.json"');
} catch (err) {
    console.err('Settings.json write FAILED!', err);
    process.exit(1);
}

