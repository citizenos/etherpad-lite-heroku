'use strict';

const eejs = require('ep_etherpad-lite/node/eejs/');
const settingsRaw = require('ep_etherpad-lite/node/utils/Settings'); const settings = settingsRaw.default || settingsRaw;

exports.eejsBlock_styles = (hook, args, cb) => {
  args.content += eejs.require('ep_foot_note/templates/styles.html', {}, module);
  return cb();
};

exports.eejsBlock_body = (hook, args, cb) => {
  args.content += eejs.require('ep_foot_note/templates/popup.html');
  return cb();
};

exports.aceAttribClasses = (hook, attr, cb) => {
  attr.fnss = 'tag:sup';
  attr.fn = 'tag:sup';
  attr.sup = 'tag:sup';
  cb(attr);
};

exports.padInitToolbar = (hookName, args) => {
  const toolbar = args.toolbar;
  if (JSON.stringify(settings.toolbar).indexOf('addFootNote') === -1) {
    settings.toolbar.left.push(['addFootNote']);
  }
  const button = toolbar.button({
    command: 'addFootNote',
    localizationId: 'ep_foot_note.toolbar.add_foot_note.title',
    class: 'buttonicon fnbtn',
  });

  toolbar.registerButton('addFootNote', button);
};
