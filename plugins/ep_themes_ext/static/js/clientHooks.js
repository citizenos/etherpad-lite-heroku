'use strict';
/* eslint-disable max-len*/
/**
 * Client-side hooks
 *
 * NOTE1: Assumes an EP version where "addEditorCSS" supports absolute urls to resources - https://github.com/ether/etherpad-lite/pull/2850
 * NOTE2: Using 2 different hooks to add styles to minimize style flicker caused by async loading of stylesheets.
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_client_side_hooks}
 */
/* eslint-enable */

const PREF_COOKIE_KEY = 'epThemesExtTheme';

const _resolveStyleUrl = (src) => {
  if (!src) return src;
  if (/^(https?:)?\/\//.test(src)) {
    return src;
  }
  if (src.startsWith('/')) {
    return `${window.location.origin}${src}`;
  }
  return src;
};

/**
 * Get stylesheets to include
 *
 * @returns Array Array of stylesheet urls
 */
const _getStyles = () => {
  const settings = clientVars.ep_themes_ext;
  let theme = 'default';

  const url = window.location.href;
  const padCookie = require('ep_etherpad-lite/static/js/pad_cookie').padcookie;
  const themeCookie = padCookie.getPref(PREF_COOKIE_KEY);

  // See if theme is specified by embed "theme" parameter, override the default
  const matches = url.match(/theme=([^=?&\s]*)/);
  if (matches && matches.length >= 2) {
    theme = matches[1];
    padCookie.setPref(PREF_COOKIE_KEY, theme);
  } else if (themeCookie) {
    theme = themeCookie;
  }

  const rawStyles =
    settings?.[theme]?.length
      ? settings[theme]
      : settings?.default?.length
        ? settings.default
        : ['/static/skins/colibris/citizenos.css'];

  return rawStyles.map(_resolveStyleUrl);
};

/**
 * Apply stylesheets to defined target JQuery elements
 *
 * @param {Array} targets Array of JQuery objects to which stylesheets are added to their <head> element
 *
 * @private
 */
const _applyStyles = (targets) => {
  const styles = _getStyles();
  if (!styles) return;

  targets.forEach(($target) => {
    const $head = $target.find('head');
    styles.forEach((src) => {
      if (!$head.find(`link[href="${src}"]`).length) {
        $head.append(`<link rel="stylesheet" type="text/css" href="${src}"/>`);
      }
    });
  });
};

/**
 * aceEditorCSS hook
 *
 * Adds the custom CSS tags to "ace_inner" and "ace_outer" frames.
 *
 * @returns {Array} Array of stylesheets to include in EP iframe[name=ace_inner] and iframe[name=ace_outer]
 */
exports.aceEditorCSS = () => {
  const styles = _getStyles();
  if (!styles) return [];
  return styles;
};

/**
 * aceInitialized hook
 *
 * Adds style tags to the Etherpad main frame (and ensures they appear after skin CSS in editor frames).
 */
exports.aceInitialized = (hookName, args, cb) => {
  const targets = [$(document)];
  const outerFrame = document.querySelector('iframe[name="ace_outer"]');
  if (outerFrame?.contentWindow?.document) {
    targets.push($(outerFrame.contentWindow.document));
    const innerFrame = outerFrame.contentWindow.document.querySelector('iframe[name="ace_inner"]');
    if (innerFrame?.contentWindow?.document) {
      targets.push($(innerFrame.contentWindow.document));
    }
  }
  _applyStyles(targets);
  return cb();
};

/**
 * postTimesliderInit hook
 *
 * Adds stylesheets to the timeline view
 */
exports.postTimesliderInit = () => {
  const watchForClientVars = setInterval(() => {
    if (!Object.keys(clientVars).length || !clientVars.ep_themes_ext) {
      return;
    }
    clearInterval(watchForClientVars);
    _applyStyles([$(document)]);
  }, 10);
};
