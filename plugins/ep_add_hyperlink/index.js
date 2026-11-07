'use strict';

const eejs = require('ep_etherpad-lite/node/eejs/');
const settingsRaw = require('ep_etherpad-lite/node/utils/Settings'); const settings = settingsRaw.default || settingsRaw;
const {JSDOM} = require('jsdom');

exports.padInitToolbar = (hookName, args, cb) => {
  const toolbar = args.toolbar;
  if (JSON.stringify(settings.toolbar).indexOf('addHyperlink') === -1) {
    settings.toolbar.left.push(['addHyperlink']);
  }
  const button = toolbar.button({
    command: 'addHyperlink',
    localizationId: 'ep_add_hyperlink.editbarButtons.hyperlink.title',
    class: 'buttonicon buttonicon-link hyperlink-icon',
  });

  toolbar.registerButton('addHyperlink', button);

  return cb();
};

exports.eejsBlock_body = (hook, args, cb) => {
  args.content += eejs.require('ep_add_hyperlink/templates/popup.ejs', {}, module);
  return cb();
};


// Add the props to be supported in export
exports.exportHtmlAdditionalTagsWithData = async (hook, pad) => {
  const ret = [];
  pad.pool.eachAttrib((k, v) => { if (k === 'url') ret.push([k, v]); });
  return ret;
};


exports.getLineHTMLForExport = async (hook, context) => {
  const elem = JSDOM.fragment(context.lineContent);
  const parseNode = async (node) => {
    const attrs = node.attributes;

    if (attrs) {
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (attr.name === 'data-url') {
          const nodeHTML = node.outerHTML.trim();

          const replaceHTML = (`${nodeHTML.substring(0, nodeHTML.length - 5)}a>`)
              .replace('<span data-url', '<a href');
          context.lineContent = JSDOM
              .fragment(`<div>${context.lineContent}</div>`).firstChild.innerHTML
              .replace(nodeHTML, replaceHTML);
        }
      }
    }

    if (node.childNodes) {
      node.childNodes.forEach(async (child) => {
        await parseNode(child);
      });
    }
  };

  await parseNode(elem);
};
