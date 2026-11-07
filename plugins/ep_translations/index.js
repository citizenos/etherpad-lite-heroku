'use strict';

const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs/promises');
const settingsRaw = require('ep_etherpad-lite/node/utils/Settings');
const getSettings = () => settingsRaw.default || settingsRaw;

const languages = {};
let settings = {};
const bundledLocalesPath = path.join(__dirname, 'locales');
let savePath = bundledLocalesPath;

const normalizeGitUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('git@github.com:')) {
    return url.replace('git@github.com:', 'https://github.com/');
  }
  return url;
};

const cloneOrPull = async (url, options) => {
  const repoUrl = normalizeGitUrl(url);
  try {
    await fs.access(savePath);
  } catch {
    await fs.mkdir(savePath, { recursive: true });
  }

  const git = simpleGit(savePath).env({
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GIT_SSH_COMMAND: 'ssh -o BatchMode=yes -o ConnectTimeout=5',
  });
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    await git.init();
  }
  const remotes = await git.getRemotes();
  if (!remotes.some((r) => r.name === 'origin')) {
    await git.addRemote('origin', repoUrl);
  } else {
    await git.remote(['set-url', 'origin', repoUrl]);
  }
  await git.pull(options.remote || 'origin', options.branch || 'master');
};

const loadTranslationsFromDir = async (dirPath) => {
  let files;
  try {
    files = await fs.readdir(dirPath);
  } catch {
    return 0;
  }
  if (!files || !files.length) {
    return 0;
  }
  const filtered = files.filter((file) => file.endsWith('.json') && file !== 'source.json');
  await Promise.all(
    filtered.map(async (file) => {
      const lang = file.split('.')[0];
      try {
        const data = await fs.readFile(path.join(dirPath, file), 'utf8');
        const languageData = JSON.parse(data);
        Object.keys(languageData).forEach((key) => {
          if (languageData[key] == null || languageData[key] === '') delete languageData[key];
        });
        languages[lang] = { ...(languages[lang] || {}), ...languageData };
      } catch (err) {
        console.error('ep_translations failed to parse locale file:', file, err);
      }
    })
  );
  return filtered.length;
};

exports.loadSettings = async (hook, context) => {
  // Always load bundled translations first so startup is instant and works offline/in containers
  const bundledCount = await loadTranslationsFromDir(bundledLocalesPath);

  try {
    const allSettings = context?.settings || getSettings();
    settings = allSettings?.ep_translations || {};
    if (settings.savePath) {
      savePath = settings.savePath;
    }
    if (settings.type === 'git' && settings.path && (settings.autoPull === true || bundledCount === 0)) {
      const options = {
        path: savePath,
        branch: settings.branch,
        implementation: settings.implementation,
      };
      try {
        await cloneOrPull(settings.path, options);
        await loadTranslationsFromDir(savePath);
      } catch (gitErr) {
        console.warn('ep_translations git pull skipped, using bundled locales:', gitErr.message);
      }
    } else if (savePath !== bundledLocalesPath) {
      await loadTranslationsFromDir(savePath);
    }
  } catch (err) {
    console.error('ep_translations ERROR', err);
  }
};

exports.clientVars = (hook, context, cb) => cb({ ep_translations: { languages } });
