'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pluginsSourceDir = path.join(rootDir, 'plugins');
const etherpadRootDir = path.join(rootDir, 'etherpad-lite');
const etherpadSrcDir = path.join(etherpadRootDir, 'src');
const pluginPackagesDir = path.join(etherpadSrcDir, 'plugin_packages');
const versionsDir = path.join(pluginPackagesDir, '.versions');
const srcNodeModulesDir = path.join(etherpadSrcDir, 'node_modules');
const rootNodeModulesDir = path.join(rootDir, 'node_modules');
const varDir = path.join(etherpadRootDir, 'var');
const customCssSrc = path.join(rootDir, 'custom', 'citizenos.css');
const customCssDest = path.join(etherpadSrcDir, 'static', 'skins', 'colibris', 'citizenos.css');

function copyDirPreserveNodeModules(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirPreserveNodeModules(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const linkTarget = fs.readlinkSync(srcPath);
      fs.rmSync(destPath, { force: true, recursive: true });
      fs.symlinkSync(linkTarget, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function ensureSymlink(target, linkPath) {
  try {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink() || stat.isDirectory() || stat.isFile()) {
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  } catch {
    // does not exist
  }
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(target, linkPath, 'dir');
}

function main() {
  // 1. Copy compiled CitizenOS theme CSS into colibris skin directory
  if (fs.existsSync(customCssSrc)) {
    fs.mkdirSync(path.dirname(customCssDest), { recursive: true });
    fs.copyFileSync(customCssSrc, customCssDest);
    console.log(`[install-plugins] Installed custom CSS -> ${path.relative(rootDir, customCssDest)}`);
  }

  // 2. Install vendored plugins from ./plugins into etherpad-lite/src/plugin_packages
  fs.mkdirSync(versionsDir, { recursive: true });
  fs.mkdirSync(srcNodeModulesDir, { recursive: true });
  fs.mkdirSync(varDir, { recursive: true });

  const installedPlugins = [];

  if (fs.existsSync(pluginsSourceDir)) {
    const entries = fs.readdirSync(pluginsSourceDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith('ep_'))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const pluginDir = path.join(pluginsSourceDir, entry.name);
      const pkgPath = path.join(pluginDir, 'package.json');
      if (!fs.existsSync(pkgPath)) continue;

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const name = pkg.name || entry.name;
      const version = pkg.version || '0.0.1';
      const versionDirName = `${name}@${version}`;
      const versionTargetDir = path.join(versionsDir, versionDirName);

      copyDirPreserveNodeModules(pluginDir, versionTargetDir);

      // Ensure plugin dependencies are resolvable from root node_modules if not already inside versionTargetDir/node_modules
      const deps = Object.keys(pkg.dependencies || {});
      if (deps.length > 0) {
        const pluginNodeModules = path.join(versionTargetDir, 'node_modules');
        fs.mkdirSync(pluginNodeModules, { recursive: true });
        for (const dep of deps) {
          const depInPlugin = path.join(pluginNodeModules, dep);
          const depInRoot = path.join(rootNodeModulesDir, dep);
          const depInSrc = path.join(srcNodeModulesDir, dep);
          if (!fs.existsSync(depInPlugin)) {
            if (fs.existsSync(depInRoot)) {
              ensureSymlink(path.relative(path.dirname(depInPlugin), depInRoot), depInPlugin);
            } else if (fs.existsSync(depInSrc)) {
              ensureSymlink(path.relative(path.dirname(depInPlugin), depInSrc), depInPlugin);
            }
          }
        }
      }

      // Symlink plugin_packages/<name> -> .versions/<name>@<version>
      const pluginPackageLink = path.join(pluginPackagesDir, name);
      ensureSymlink(path.join('.versions', versionDirName), pluginPackageLink);

      // Symlink etherpad-lite/src/node_modules/<name> -> ../plugin_packages/<name>
      const nodeModuleLink = path.join(srcNodeModulesDir, name);
      ensureSymlink(path.join('..', 'plugin_packages', name), nodeModuleLink);

      installedPlugins.push({ name, version });
      console.log(`[install-plugins] Linked ${name}@${version}`);
    }
  }

  // Always include ep_etherpad-lite in installed_plugins.json
  const corePkgPath = path.join(etherpadSrcDir, 'package.json');
  const corePkg = fs.existsSync(corePkgPath)
    ? JSON.parse(fs.readFileSync(corePkgPath, 'utf8'))
    : { name: 'ep_etherpad-lite', version: '3.3.3' };
  installedPlugins.push({
    name: corePkg.name || 'ep_etherpad-lite',
    version: corePkg.version || '3.3.3',
  });

  const installedPluginsPath = path.join(varDir, 'installed_plugins.json');
  fs.writeFileSync(
    installedPluginsPath,
    JSON.stringify({ plugins: installedPlugins }, null, 2) + '\n',
    'utf8'
  );
  console.log(`[install-plugins] Wrote ${path.relative(rootDir, installedPluginsPath)} (${installedPlugins.length} plugins)`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
