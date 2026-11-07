'use strict';

const collectContentPre = (hook, context) => {
  const color = /(?:^| )color:([A-Za-z0-9]*)/.exec(context.cls);
  if (color && color[1]) {
    context.cc.doAttrib(context.state, `color::${color[1]}`);
  }
};

const collectContentPost = (hook, context) => {};

exports.collectContentPre = collectContentPre;
exports.collectContentPost = collectContentPost;
