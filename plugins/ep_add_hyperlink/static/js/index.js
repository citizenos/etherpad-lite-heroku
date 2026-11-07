'use strict';

let showDialog = function () {
  const curLine = (this.rep.lines.atIndex(this.rep.selEnd[0])).lineNode;
  $('.hyperlink-dialog').css('top', $(curLine).offset().top + $(curLine).height());
  $('.hyperlink-dialog').addClass('popup-show');
};

let addLinkListeners = () => {
  const padOuter = $('iframe[name="ace_outer"]').contents();
  const padInner = padOuter.find('iframe[name="ace_inner"]');
  padInner.contents().find('a').off();
  padInner.contents().find('a').on('click', (e) => {
    const range = new Range();
    const selection = padInner.contents()[0].getSelection();
    range.selectNodeContents($(e.target)[0]);
    selection.removeAllRanges();
    selection.addRange(range);
    $('.hyperlink-text').val($(e.target).text());
    $('.hyperlink-url').val($(e.target).attr('href'));
    padInner.contents().on('click', () => {
      $('.hyperlink-dialog').removeClass('popup-show');
    });
    showDialog();
    e.preventDefault();
    return false;
  });
};

exports.aceSelectionChanged = (hook, context) => {
  if ($('.hyperlink-dialog').hasClass('popup-show')) {
    const curLine = (context.rep.lines.atIndex(context.rep.selEnd[0])).lineNode;
    $('.hyperlink-dialog').css('top', $(curLine).offset().top + $(curLine).height());
  }
};

exports.postToolbarInit = (hookName, args) => {
  const editbar = args.toolbar;

  editbar.registerCommand('addHyperlink', () => {
    $('.hyperlink-text').val('');
    $('.hyperlink-url').val('');

    const padOuter = $('iframe[name="ace_outer"]').contents();
    const padInner = padOuter.find('iframe[name="ace_inner"]').contents()[0];
    const selection = padInner.getSelection();
    $('.hyperlink-text').val(selection.toString());
    showDialog();
  });
};

exports.postAceInit = (hook, context) => {
  if (!$('#editorcontainerbox').hasClass('flex-layout')) {
    $.gritter.add({
      title: 'Error',
      text: 'Ep_embed_hyperlink2: Please upgrade to etherpad 1.9 for this plugin to work correctly',
      sticky: true,
      class_name: 'error',
    });
  }
  /* Event: User clicks editbar button */
  $('.hyperlink-icon').on('click', () => {
    $('.hyperlink-text').val('');
    $('.hyperlink-url').val('');

    const padOuter = $('iframe[name="ace_outer"]').contents();
    const padInner = padOuter.find('iframe[name="ace_inner"]').contents()[0];
    const selection = padInner.getSelection();
    $('.hyperlink-text').val(selection.toString());
    showDialog();
  });

  /* Event: User creates new hyperlink */
  $('.hyperlink-save').on('click', () => {
    let url = $('.hyperlink-url').val();
    const text = $('.hyperlink-text').val();
    if (!(/^http:\/\//.test(url)) && !(/^https:\/\//.test(url))) {
      url = `http://${url}`;
    }
    context.ace.callWithAce((ace) => {
      const rep = ace.ace_getRep();
      const start = rep.selStart;
      ace.ace_replaceRange(start, rep.selEnd, text);
      ace.ace_performSelectionChange(start, [start[0], start[1] + text.length], true);
      if (ace.ace_getAttributeOnSelection('url')) {
        ace.ace_setAttributeOnSelection('url', false);
      } else {
        ace.ace_setAttributeOnSelection('url', url);
      }
    }, 'insertLink', true);
    $('.hyperlink-text').val('');
    $('.hyperlink-url').val('');
    $('.hyperlink-dialog').removeClass('popup-show');
    addLinkListeners();
  });

  $('.hyperlink-remove').on('click', () => {
    context.ace.callWithAce((ace) => {
      ace.ace_setAttributeOnSelection('url', false);
    }, 'removeLink', true);
    $('.hyperlink-text').val('');
    $('.hyperlink-url').val('');
    $('.hyperlink-dialog').removeClass('popup-show');
    addLinkListeners();
  });

  /* User press Enter on url input */
  $('.hyperlink-url').on('keyup', (e) => {
    if (e.keyCode === 13) {
      $('.hyperlink-save').click();
    }
  });
  addLinkListeners();
};

exports.acePostWriteDomLineHTML = () => {
  setTimeout(() => {
    addLinkListeners();
  });
};

exports.aceAttribsToClasses = (hook, context) => {
  if (context.key === 'url') {
    let url = /(?:^| )url-(\S*)/.exec(context.value);
    if (!url) {
      url = context.value;
    } else {
      url = url[1];
    }

    return ['url', `url-${url}`];
  }
};

/* Convert the classes into a tag */
exports.aceCreateDomLine = (name, context) => {
  const cls = context.cls;
  let url = /(?:^| )url-(\S*)/.exec(cls);
  let modifier = {};
  if (url != null) {
    url = url[1];
    if (!(/^http:\/\//.test(url)) && !(/^https:\/\//.test(url))) {
      url = `'http://${url}`;
    }

    modifier = {
      extraOpenTags: `<a href="${url}">`,
      extraCloseTags: '</a>',
      cls,
    };
    return modifier;
  }
  return [];
};

exports.aceInitialized = (hook, context) => {
  addLinkListeners = addLinkListeners.bind(context);
  showDialog = showDialog.bind(context);
};

exports.collectContentPre = (hook, context) => {
  const url = /(?:^| )url-(\S*)/.exec(context.cls);
  if (url) {
    context.cc.doAttrib(context.state, `url::${url[1]}`);
  }
};
