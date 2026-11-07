'use strict';

// All our colors are block elements, so we just return them.
const colors = ['black', 'red', 'green', 'blue', 'yellow', 'orange'];

// Bind the event handler to the toolbar buttons
const postAceInit = (hook, context) => {
  const hs = $('.color-selection, #color-selection');
  hs.on('change', function () {
    const value = $(this).val();
    const intValue = parseInt(value, 10);
    if (!isNaN(intValue)) {
      context.ace.callWithAce((ace) => {
        ace.ace_doInsertColors(intValue);
      }, 'insertColor', true);
      hs.val('dummy');
    }
  });
  $('.font_color').hover(() => {
    $('.submenu > .color-selection').attr('size', 6);
    $('.submenu > #color-selection').attr('size', 6);
  });
  $('.font-color-icon').click(() => {
    $('#font-color').toggle();
  });
};

// Our colors attribute will result in a color:red... _yellow class
const aceAttribsToClasses = (hook, context) => {
  if (context.key.indexOf('color:') !== -1) {
    const color = /(?:^| )color:([A-Za-z0-9]*)/.exec(context.key);
    return [`color:${color[1]}`];
  }
  if (context.key === 'color') {
    return [`color:${context.value}`];
  }
};


// Here we convert the class color:red into a tag
exports.aceCreateDomLine = (name, context) => {
  const cls = context.cls;
  const colorsType = /(?:^| )color:([A-Za-z0-9]*)/.exec(cls);

  let tagIndex;
  if (colorsType) tagIndex = colors.indexOf(colorsType[1]);

  if (tagIndex !== undefined && tagIndex >= 0) {
    const modifier = {
      extraOpenTags: '',
      extraCloseTags: '',
      cls,
    };
    return [modifier];
  }
  return [];
};


// Find out which lines are selected and assign them the color attribute.
// Passing a level >= 0 will set a colors on the selected lines, level < 0
// will remove it
const doInsertColors = function (level) {
  const rep = this.rep;
  const documentAttributeManager = this.documentAttributeManager;
  if (!(rep.selStart && rep.selEnd) || (level >= 0 && colors[level] === undefined)) {
    return;
  }

  let newColor = ['color', ''];
  if (level >= 0) {
    newColor = ['color', colors[level]];
  }

  documentAttributeManager.setAttributesOnRange(rep.selStart, rep.selEnd, [newColor]);
};


// Once ace is initialized, we set ace_doInsertColors and bind it to the context
const aceInitialized = (hook, context) => {
  const editorInfo = context.editorInfo;
  editorInfo.ace_doInsertColors = doInsertColors.bind(context);
};

const postToolbarInit = (hook, context) => {
  const editbar = context.toolbar;

  editbar.registerCommand('fontColor', (buttonName, toolbar, item) => {
    $(item.$el).after($('#font-color'));
    $('#font-color').toggle();
  });
};

const aceEditEvent = (hook, call) => {
  const cs = call.callstack;
  const attrManager = call.documentAttributeManager;
  const rep = call.rep;
  const allowedEvents = ['handleClick', 'handleKeyEvent'];
  if (allowedEvents.indexOf(cs.type) === -1 && !(cs.docTextChanged)) {
    return;
  }

  // If it's an initial setup event then do nothing..
  if (cs.type === 'setBaseText' || cs.type === 'setup') return;
  // It looks like we should check to see if this section has this attribute
  setTimeout(() => { // avoid race condition..
    const colorSelect = $('.color-selection, #color-selection');
    colorSelect.val('dummy'); // reset value to the dummy value
    colorSelect.niceSelect('update');
    // Attribtes are never available on the first X caret position so we need to ignore that
    if (rep.selStart[1] === 0) {
      // Attributes are never on the first line
      return;
    }
    // The line has an attribute set, this means it wont get hte correct X caret position
    if (rep.selStart[1] === 1) {
      if (rep.alltext[0] === '*') {
        // Attributes are never on the "first" character of lines with attributes
        return;
      }
    }
    // the caret is in a new position.. Let's do some funky shit
    const startAttribs = attrManager.getAttributesOnPosition(rep.selStart[0], rep.selStart[1]);
    const endAttribs = attrManager.getAttributesOnPosition(rep.selEnd[0], rep.selEnd[1]);
    const [startColor] = startAttribs.filter((item) => item[0] === 'color');
    const [endColor] = endAttribs.filter((item) => item[0] === 'color');
    if (!startColor && !endColor) return;
    $.each(colors, (k, v) => {
      if (startColor && startColor[1] === v && (!endColor || endColor[1] === v)) {
        colorSelect.val(k);
      } else if (!startColor && endColor[1] === v) {
        colorSelect.val(k);
      }
    });
    colorSelect.niceSelect('update');
  }, 250);

  return;
};
// Export all hooks
exports.postToolbarInit = postToolbarInit;
exports.aceInitialized = aceInitialized;
exports.postAceInit = postAceInit;
exports.aceAttribsToClasses = aceAttribsToClasses;
exports.aceEditEvent = aceEditEvent;
exports.aceEditorCSS = () => ['ep_font_color/static/css/color.css'];
