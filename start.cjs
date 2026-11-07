#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const log4js = require('log4js');
const { main: installBundledPlugins } = require('./scripts/install-plugins.cjs');

log4js.configure({
    appenders: { console: { type: 'console' } },
    categories: { default: { appenders: ['console'], level: 'debug' } }
});
const logger = log4js.getLogger('start.js');
logger.level = process.env.ETHERPAD_LITE_HEROKU_LOGGER_LEVEL || 'debug';

let settingsLocal = null; // Your local config in '/config/local.json'
let settingsEnv = null; // Settings defined in environment variable 'ETHERPAD_SETTINGS'
let settingsDb = null; // DB settings derived from `DATABASE_URL` variable set by Heroku

function deepMerge(target, ...sources) {
    for (const source of sources) {
      if (source && typeof source === 'object') {
        for (const key of Object.keys(source)) {
          if (
            source[key] &&
            typeof source[key] === 'object' &&
            !Array.isArray(source[key])
          ) {
            if (!target[key] || typeof target[key] !== 'object') {
              target[key] = {};
            }
            deepMerge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
    }
    return target;
}

function normalizeEtherpadV3Settings(settings) {
    if (process.env.PORT) {
        settings.port = parseInt(process.env.PORT, 10);
    }

    if (settings.abiword === null) {
        delete settings.abiword;
    }

    if ('disableIPlogging' in settings) {
        if (settings.ipLogging === undefined) {
            settings.ipLogging = settings.disableIPlogging ? 'anonymous' : 'full';
        }
        delete settings.disableIPlogging;
    }
    if (typeof settings.ipLogging === 'boolean') {
        settings.ipLogging = settings.ipLogging ? 'full' : 'anonymous';
    }

    if (settings.enableDarkMode === undefined) {
        settings.enableDarkMode = false;
    }

    if (!settings.skinName) {
        settings.skinName = 'colibris';
    }

    if (!settings.authenticationMethod) {
        settings.authenticationMethod = 'apikey';
    }

    if (settings.padOptions && typeof settings.padOptions === 'object') {
        if (settings.padOptions.userName === false) {
            settings.padOptions.userName = null;
        }
        if (settings.padOptions.userColor === false) {
            settings.padOptions.userColor = null;
        }
    }

    if (Array.isArray(settings.socketTransportProtocols)) {
        settings.socketTransportProtocols = ['websocket', 'polling'];
    }

    if (settings.toolbar && typeof settings.toolbar === 'object') {
        delete settings.toolbar.custom_inline;
    }

    if (!settings.ep_themes_ext || typeof settings.ep_themes_ext !== 'object') {
        settings.ep_themes_ext = {};
    }
    if (!Array.isArray(settings.ep_themes_ext.default) || settings.ep_themes_ext.default.length === 0) {
        settings.ep_themes_ext.default = ['/static/skins/colibris/citizenos.css'];
    }
    if (!Array.isArray(settings.ep_themes_ext['citizenos.com']) || settings.ep_themes_ext['citizenos.com'].length === 0) {
        settings.ep_themes_ext['citizenos.com'] = ['/static/skins/colibris/citizenos.css'];
    }

    return settings;
}

if (process.env.ETHERPAD_IGNORE_LOCAL_CONFIG !== 'true') {
    logger.info('Checking for config/local.json...');
    try {
        settingsLocal = require('./config/local.json');
        logger.info('local.json found!');
    } catch (err) {
        logger.info('local.json NOT found!');
    }
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

// Check if Heroku's default DATABASE_URL is set in the ENV and override DB settings
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
    logger.info('Overriding database configuration from DATABASE_URL!');

    settingsDb = {};
    settingsDb.dbType = databaseUrl.split(':')[0];
    settingsDb.dbSettings = databaseUrl.includes('?') ? databaseUrl : `${databaseUrl}?ssl=true`;
}

logger.info('Merging config/local.json and "ETHERPAD_SETTINGS" configuration...');
const settings = normalizeEtherpadV3Settings(
    deepMerge({}, settingsLocal || {}, settingsEnv || {}, settingsDb || {})
);

if (typeof settings.dbSettings === 'string') {
    logger.info('DB configuration is a connection string, parsing into object...');

    const dbSettingsString = settings.dbSettings;
    let dbSettingsObject = null;

    const [url, params] = dbSettingsString.split('?');
    const matches = url.match(/^(?<type>.*?):\/\/(?<user>.*?):(?<password>.*?)@(?<host>.*?):(?<port>.*=?)\/(?<database>[^?]*)/);

    if (matches && matches.groups) {
        dbSettingsObject = { ...matches.groups };
        if (params) {
            const urlSearchParams = new URLSearchParams(params);
            urlSearchParams.forEach(function (value, key) {
                dbSettingsObject[key] = value;
            });
        }
        settings.dbType = dbSettingsObject.type;
        settings.dbSettings = dbSettingsObject;
    } else {
        logger.error('Invalid DB connection string provided as "dbSettings"');
        process.exit(1);
    }
}

logger.info('\nWrite the Etherpad API key to the disk from the ENV "ETHERPAD_API_KEY" or local.json "___apiKey"...');
const etherpadApiKey = process.env.ETHERPAD_API_KEY || settings.___apiKey;
if (etherpadApiKey) {
    logger.info('ETHERPAD_API_KEY found!');
    fs.writeFileSync('./etherpad-lite/APIKEY.txt', etherpadApiKey);
    delete settings.___apiKey;
} else {
    logger.info('ETHERPAD_API_KEY NOT found!');
}

logger.info('\nWrite the Etherpad session key to the disk from the ENV "ETHERPAD_SESSION_KEY" or local.json "___sessionKey"...');
const etherpadSessionKey = process.env.ETHERPAD_SESSION_KEY || settings.___sessionKey;
if (etherpadSessionKey) {
    logger.info('ETHERPAD_SESSION_KEY found!');
    fs.writeFileSync('./etherpad-lite/SESSIONKEY.txt', etherpadSessionKey);
    delete settings.___sessionKey;
} else {
    logger.info('ETHERPAD_SESSION_KEY NOT found!');
}

logger.info('\nEnsuring bundled CitizenOS plugins and custom styles are installed...');
installBundledPlugins();

logger.info('\nChecking plugin configuration from effective settings...');
const pluginsToInstall = [];
const forceInstall = process.env.ETHERPAD_FORCE_PLUGIN_INSTALL === 'true';

Object.keys(settings).forEach(function (key) {
    if (key.startsWith('ep_')) {
        const pluginConfig = settings[key] || {};
        const version = pluginConfig.___version;
        const type = pluginConfig.type;
        const gitPath = pluginConfig.path;
        const preinstalledPath = path.resolve('./etherpad-lite/src/plugin_packages', key);
        const isPreinstalled = fs.existsSync(preinstalledPath);

        if (!isPreinstalled || forceInstall) {
            // Note: For ep_translations, type/path/savePath configure the translations repository, not the plugin package itself.
            if (key !== 'ep_translations' && type === 'git' && gitPath) {
                let githubRepo = gitPath;
                if (githubRepo.includes('github.com')) {
                    githubRepo = githubRepo.replace('git@github.com:', '').replace('https://github.com/', '').replace('.git', '');
                }
                pluginsToInstall.push({ method: 'installFromGitHub', arg: `'${githubRepo}'`, name: key });
                logger.info('Queued plugin from git/github: ' + key + ' (' + githubRepo + ')');
            } else if (version) {
                pluginsToInstall.push({ method: 'installPlugin', arg: `'${key}', '${version}'`, name: key });
                logger.info('Queued plugin: ' + key + '@' + version);
            }
        } else {
            logger.info(`Plugin ${key} is already pre-installed.`);
        }

        // Remove installer metadata keys so Etherpad startup does not warn about unknown keys
        delete pluginConfig.___version;
        if (key !== 'ep_translations') {
            delete pluginConfig.type;
            delete pluginConfig.path;
            delete pluginConfig.savePath;
        }
    }
});

if (pluginsToInstall.length > 0) {
    const bridgePath = path.resolve('./bridge_install.ts');
    try {
        const bridgeScript = `
const {linkInstaller, checkForMigration} = require('./etherpad-lite/src/static/js/pluginfw/installer');
const {persistInstalledPlugins} = require('./etherpad-lite/bin/commonPlugins');
(async () => {
  try {
    if (checkForMigration) {
        await checkForMigration();
    }
    ${pluginsToInstall.map(p => `
    try {
      console.log('Installing ${p.name}...');
      await linkInstaller.${p.method}(${p.arg});
    } catch (err) {
      console.error('FAILED to install ${p.name}: ' + err.message);
    }
    `).join('\n')}
    await persistInstalledPlugins();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during plugin installation: ' + err.message);
    process.exit(1);
  }
})();
`;
        fs.writeFileSync(bridgePath, bridgeScript);
        logger.info('Executing batched plugin installation for non-bundled plugins...');
        childProcess.execSync('pnpm tsx bridge_install.ts', {
            cwd: '.',
            stdio: 'inherit',
            env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=400' }
        });
    } catch (pluginErr) {
        logger.error('FAILED to install one or more plugins. Error: ' + pluginErr.message);
    } finally {
        fs.rmSync(bridgePath, { force: true });
    }
}

const pathSettings = path.resolve('./etherpad-lite/settings.json');
logger.info('\nWrite settings.json file which is read by EP to ' + pathSettings);
try {
    fs.writeFileSync(pathSettings, JSON.stringify(settings, null, 2));
    logger.info('Settings.json written to ' + pathSettings);
} catch (err) {
    logger.error('Settings.json write FAILED to ' + pathSettings, err);
    process.exit(1);
}
logger.info('Configuration done!\n');

// Run Etherpad via absolute path to bin/run.sh so dirname "$0" inside run.sh resolves properly
let serverCommand = path.resolve(__dirname, 'etherpad-lite/bin/run.sh');
let args = [];

if (process.env.ETHERPAD_ALLOW_ROOT) {
    args.push('--root');
}

logger.info('Starting Etherpad server with command: ' + serverCommand + ' ' + args.join(' '));

const serverProcess = childProcess.spawn(serverCommand, args, { stdio: 'inherit' });

serverProcess.on('close', (code) => {
    logger.info(`Etherpad process exited with code ${code}`);
    process.exit(code);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, killing child process...');
    serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, killing child process...');
    serverProcess.kill('SIGINT');
});
