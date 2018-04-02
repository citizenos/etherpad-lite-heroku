#!/usr/bin/env node

/**
 * JavaScript version of the preparse.rb originally created by talexand
 *
 * @see https://github.com/talexand/etherpad-lite-heroku
 */

var fs = require('fs');
var _ = require('lodash');
var kexec = require('kexec');

// Defaults from the file bundled in the repo
var settings = JSON.parse(fs.readFileSync('settings.json').toString());

// Lets see if Herokus default DATABASE_URL is set in the ENV and override DB settings
var databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
    settings.dbType = databaseUrl.split(':')[0];
    settings.dbSettings = databaseUrl + '?ssl=true';
}

// Overrides from ENV
var settingsEnv = process.env.ETHERPAD_SETTINGS;
if (settingsEnv) {
    settings = _.merge(settings, JSON.parse(settingsEnv));
}

// Write settings.json file which is read by EP
fs.writeFileSync('./etherpad-lite/settings.json', JSON.stringify(settings, null, 2));

// Write the Etherpad API key to the disk from the ENV
var etherpadApiKey = process.env.ETHERPAD_API_KEY;
if (etherpadApiKey) {
    fs.writeFileSync('./etherpad-lite/APIKEY.txt', etherpadApiKey);
}

// Write the Etherpad session key to the disk from the ENV
var etherpadSessionKey = process.env.ETHERPAD_SESSION_KEY;
if (etherpadSessionKey) {
    fs.writeFileSync('./etherpad-lite/SESSIONKEY.txt', etherpadSessionKey);
}

var childProcess = require('child_process');
childProcess.execSync('./installPackages.sh');

// Run the Etherpad itself. Using kexec so that the current process would get replaced with the new one
if (process.env.ETHERPAD_ALLOW_ROOT) {
    kexec('./etherpad-lite/bin/safeRun.sh log.log --root');
    kexec('kill node');
    kexec('node --optimize_for_size --max_old_space_size=460 --gc_interval=100 ./etherpad-lite/node_modules/ep_etherpad-lite/node/server.js ');
} else {
    kexec('./etherpad-lite/bin/safeRun.sh log.log');
    kexec('kill node');
    kexec('node --optimize_for_size --max_old_space_size=460 --gc_interval=100 ./etherpad-lite/node_modules/ep_etherpad-lite/node/server.js ');
} 
