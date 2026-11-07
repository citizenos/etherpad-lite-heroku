'use strict';

describe('ep_add_hyperlink', function () {
  beforeEach(function (cb) {
    helper.newPad(() => {
      cb();
    });
    this.timeout(60000);
  });

  // todo keypress enter
  it('add links via toolbar icon and pressing ok button', async function (done) {
    this.timeout(60000);
    const inner$ = helper.padInner$;
    let firstLine = inner$('div').first();
    // select first line content
    firstLine.sendkeys('{selectall}');

    // replace with text

    await firstLine.sendkeys('1link, 2link, 3link');
    await helper.waitFor(() => inner$('div').first().text() === '1link, 2link, 3link');
    firstLine = inner$('div').first();
    helper.selectLines(firstLine, firstLine, 0, 5);
    //   selectRange(helper.padOuter$('iframe'), firstLine, 0, 5);

    // FIXME convention: click handler does not listen on buttonicon-link
    helper.padChrome$('.hyperlink-icon').click();
    helper.padChrome$('.hyperlink-url').val('beta.etherpad.com/#anchor1');
    helper.padChrome$('.hyperlink-save').click();

    await helper.waitFor(() => {
      const lineText = inner$('div').first();
      const firstSpan = lineText.children(0);
      return firstSpan.length &&
        firstSpan.find('a').length &&
        lineText.text() === '1link, 2link, 3link' &&
        firstSpan.find('a')[0].attributes.href.value === 'http://beta.etherpad.com/#anchor1' &&
        firstSpan.hasClass('url-http://beta.etherpad.com/#anchor1');
    });
    firstLine = inner$('div').first();
    helper.selectLines(firstLine, firstLine, 7, 12);
    helper.padChrome$('.hyperlink-icon').click();
    helper.padChrome$('.hyperlink-url').val('beta.etherpad.com/#anchor2');
    helper.padChrome$('.hyperlink-save').click();

    await helper.waitFor(() => {
      const lineText = inner$('div').first();
      const firstSpan = lineText.children(0);
      const thirdSpan = lineText.children(2);

      return firstSpan.length && lineText.text() === '1link, 2link, 3link' &&
        lineText.find('a')[0].attributes.href.value === 'http://beta.etherpad.com/#anchor1' &&
        lineText.find('a')[1].attributes.href.value === 'http://beta.etherpad.com/#anchor2' &&
        firstSpan.hasClass('url-http://beta.etherpad.com/#anchor1') &&
        thirdSpan.hasClass('url-http://beta.etherpad.com/#anchor2');
    });

    firstLine = inner$('div').first();
    helper.selectLines(firstLine, firstLine, 14, 19);
    helper.padChrome$('.hyperlink-icon').click();
    helper.padChrome$('.hyperlink-url').val('beta.etherpad.com/#anchor3');
    helper.padChrome$('.hyperlink-save').click();

    await helper.waitFor(() => {
      const lineText = inner$('div').first();
      const firstSpan = lineText.children(0);
      const thirdSpan = lineText.children(2);
      const fifthSpan = lineText.children(4);

      return lineText.text() === '1link, 2link, 3link' && lineText.find('a').length &&
        lineText.find('a')[0].attributes.href.value === 'http://beta.etherpad.com/#anchor1' &&
        lineText.find('a')[1].attributes.href.value === 'http://beta.etherpad.com/#anchor2' &&
        lineText.find('a')[2].attributes.href.value === 'http://beta.etherpad.com/#anchor3' &&
        firstSpan.hasClass('url-http://beta.etherpad.com/#anchor1') &&
        thirdSpan.hasClass('url-http://beta.etherpad.com/#anchor2') &&
        fifthSpan.hasClass('url-http://beta.etherpad.com/#anchor3');
    });

    done();
  });

  it('overwriting a link with another one does work', async function (done) {
    const inner$ = helper.padInner$;
    let firstLine = inner$('div').first();

    // select first line content
    firstLine.sendkeys('{selectall}');

    // replace with text
    await firstLine.sendkeys('1link, 2link, 3link');
    await helper.waitFor(() => inner$('div').first().text() === '1link, 2link, 3link');

    firstLine = inner$('div').first();
    helper.selectLines(firstLine, firstLine, 0, 5);

    // FIXME convention: click handler does not listen on buttonicon-link
    helper.padChrome$('.hyperlink-icon').click();
    helper.padChrome$('.hyperlink-url').val('beta.etherpad.com/#anchor1');
    helper.padChrome$('.hyperlink-save').click();

    firstLine = inner$('div').first();
    helper.selectLines(firstLine, firstLine, 7, 12);
    helper.padChrome$('.hyperlink-icon').click();
    helper.padChrome$('.hyperlink-url').val('beta.etherpad.com/#anchor2');
    helper.padChrome$('.hyperlink-save').click();

    firstLine = inner$('div').first();
    helper.selectLines(firstLine, firstLine, 14, 19);
    helper.padChrome$('.hyperlink-icon').click();
    helper.padChrome$('.hyperlink-url').val('beta.etherpad.com/#anchor3');
    helper.padChrome$('.hyperlink-save').click();

    firstLine = inner$('div').first();
    firstLine.sendkeys('{selectall}');
    helper.padChrome$('.hyperlink-icon').click();
    helper.padChrome$('.hyperlink-url').val('beta.etherpad.com/#overwritten');
    helper.padChrome$('.hyperlink-save').click();

    await helper.waitFor(() => {
      const lineText = inner$('div').first();
      const firstSpan = lineText.children(0);
      const firstSpanText = firstSpan.text();

      return firstSpan.length && lineText.text() === '1link, 2link, 3link' &&
        firstSpan.find('a')[0].attributes.href.value === 'http://beta.etherpad.com/#overwritten' &&
        firstSpanText === lineText.text() &&
        firstSpan.hasClass('url-http://beta.etherpad.com/#overwritten');
    });

    done();
  });

  it('links work for text with additional attributes', async function (done) {
    const inner$ = helper.padInner$;
    let firstLine = inner$('div').first();

    // select first line content
    firstLine.sendkeys('{selectall}');

    // replace with text
    await firstLine.sendkeys('1link, 2bold, 3link');
    await helper.waitFor(() => inner$('div').first().text() === '1link, 2bold, 3link');

    // make some chars bold
    firstLine = inner$('div').first();
    helper.selectLines(firstLine, firstLine, 7, 12);
    helper.padChrome$('.buttonicon-bold').click();

    firstLine = inner$('div').first();
    firstLine.sendkeys('{selectall}');
    helper.padChrome$('.hyperlink-icon').click();
    helper.padChrome$('.hyperlink-url').val('beta.etherpad.com/');
    helper.padChrome$('.hyperlink-save').click();

    await helper.waitFor(() => {
      const lineText = inner$('div').first();
      const firstSpan = lineText.children(0);
      const secondSpan = lineText.children(1);
      const thirdSpan = lineText.children(2);

      return firstSpan.children().length && lineText.text() === '1link, 2bold, 3link' &&
        firstSpan.find('a')[0].attributes.href.value === 'http://beta.etherpad.com/' &&
        secondSpan.find('a')[0].attributes.href.value === 'http://beta.etherpad.com/' &&
        thirdSpan.find('a')[0].attributes.href.value === 'http://beta.etherpad.com/' &&
        firstSpan.hasClass('url-http://beta.etherpad.com/') &&
        secondSpan.hasClass('url-http://beta.etherpad.com/') &&
        thirdSpan.hasClass('url-http://beta.etherpad.com/');
    });

    await helper.waitFor(() => {
      const lineText = inner$('div').first();
      lineText.sendkeys('{selectall}');

      helper.padChrome$('.buttonicon-bold').click();
      return lineText.children(0).length && lineText.children(0).hasClass('b');
    });

    done();
  });
});
