'use strict';

const eejs = require('ep_etherpad-lite/node/eejs/');
const settingsRaw = require('ep_etherpad-lite/node/utils/Settings'); const settings = settingsRaw.default || settingsRaw;

exports.eejsBlock_editbarMenuLeft = (hook, args, cb) => {
  if (JSON.stringify(settings.toolbar).indexOf('fontColor') > -1) {
    return cb();
  }
  args.content += eejs.require('ep_font_color/templates/editbarButtons.ejs');
  return cb();
};

exports.eejsBlock_dd_format = (hook, args, cb) => {
  args.content += eejs.require('ep_font_color/templates/fileMenu.ejs');
  return cb();
};

exports.padInitToolbar = (hook, args, cb) => {
  const toolbar = args.toolbar;
  const colors = ['black', 'red', 'green', 'blue', 'yellow', 'orange'];
  const fontColor = toolbar.selectButton({
    command: 'fontColor',
    class: 'color-selection',
    selectId: 'color-selection',
  });
  fontColor.addOption('dummy', 'color', {'data-l10n-id': 'ep_font_color.color'});
  colors.forEach((color, value) => {
    fontColor.addOption(value, color, {'data-l10n-id': `ep_font_color.${color}`});
  });

  toolbar.registerButton('fontColor', fontColor);
  return cb();
};
