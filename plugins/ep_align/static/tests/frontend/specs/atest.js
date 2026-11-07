'use strict';

describe('Alignment of Text', function () {
  // create a new pad before each test run
  beforeEach(function (cb) {
    helper.newPad(cb);
    this.timeout(60000);
  });

  // Create Pad
  // Check Center Alignment
  // Check Left Alignment
  // Check Right Alignment
  // Check Highlighting text and setting it to un-bold works

  it('Center Aligns the Text', function (done) {
    this.timeout(150);
    const alignment = 'center';
    const inner$ = helper.padInner$;
    const chrome$ = helper.padChrome$;

    // get the first text element out of the inner iframe
    const $firstTextElement = inner$('div').first();

    // select this text element
    $firstTextElement.sendkeys('{selectall}');

    // get the bold button and click it
    const $button = chrome$('.ep_align_center');
    $button.click();

    // ace creates a new dom element when you press a button
    // so just get the first text element again
    const $newFirstTextElement = inner$('div').first().first();
    const $alignedSpanStyles = $newFirstTextElement.children().first().attr('style');

    const hasAlignment =
      ($alignedSpanStyles.indexOf(`text-align: ${alignment}`) !== -1 ||
       $alignedSpanStyles.indexOf(`text-align:${alignment}`) !== -1);

    // expect it to be aligned correctly
    expect(hasAlignment).to.be(true);

    // make sure the text hasn't changed
    expect($newFirstTextElement.text()).to.eql($firstTextElement.text());

    done();
  });

  it('Left Aligns the Text', function (done) {
    this.timeout(150);
    const alignment = 'left';
    const inner$ = helper.padInner$;
    const chrome$ = helper.padChrome$;

    // get the first text element out of the inner iframe
    const $firstTextElement = inner$('div').first();

    // select this text element
    $firstTextElement.sendkeys('{selectall}');

    // get the bold button and click it
    const $button = chrome$('.ep_align_left');
    $button.click();

    // ace creates a new dom element when you press a button
    // so just get the first text element again
    const $newFirstTextElement = inner$('div').first().first();
    const $alignedSpanStyles = $newFirstTextElement.children().first().attr('style');

    const hasAlignment =
      ($alignedSpanStyles.indexOf(`text-align: ${alignment}`) !== -1 ||
       $alignedSpanStyles.indexOf(`text-align:${alignment}`) !== -1);

    // expect it to be aligned correctly
    expect(hasAlignment).to.be(true);

    // make sure the text hasn't changed
    expect($newFirstTextElement.text()).to.eql($firstTextElement.text());

    done();
  });

  it('Right Aligns the Text', function (done) {
    this.timeout(150);
    const alignment = 'right';
    const inner$ = helper.padInner$;
    const chrome$ = helper.padChrome$;

    // get the first text element out of the inner iframe
    const $firstTextElement = inner$('div').first();

    // select this text element
    $firstTextElement.sendkeys('{selectall}');

    // get the bold button and click it
    const $button = chrome$(`.ep_align_${alignment}`);
    $button.click();

    // ace creates a new dom element when you press a button
    // so just get the first text element again
    const $newFirstTextElement = inner$('div').first().first();
    const $alignedSpanStyles = $newFirstTextElement.children().first().attr('style');

    const hasAlignment =
      ($alignedSpanStyles.indexOf(`text-align: ${alignment}`) !== -1 ||
       $alignedSpanStyles.indexOf(`text-align:${alignment}`) !== -1);

    // expect it to be aligned correctly
    expect(hasAlignment).to.be(true);

    // make sure the text hasn't changed
    expect($newFirstTextElement.text()).to.eql($firstTextElement.text());

    done();
  });

  it('Justify Aligns the Text', function (done) {
    this.timeout(150);
    const alignment = 'justify';
    const inner$ = helper.padInner$;
    const chrome$ = helper.padChrome$;

    // get the first text element out of the inner iframe
    const $firstTextElement = inner$('div').first();

    // select this text element
    $firstTextElement.sendkeys('{selectall}');

    // get the bold button and click it
    const $button = chrome$(`.ep_align_${alignment}`);
    $button.click();

    // ace creates a new dom element when you press a button
    // so just get the first text element again
    const $newFirstTextElement = inner$('div').first().first();
    const $alignedSpanStyles = $newFirstTextElement.children().first().attr('style');

    const hasAlignment =
      ($alignedSpanStyles.indexOf(`text-align: ${alignment}`) !== -1 ||
       $alignedSpanStyles.indexOf(`text-align:${alignment}`) !== -1);

    // expect it to be aligned correctly
    expect(hasAlignment).to.be(true);

    // make sure the text hasn't changed
    expect($newFirstTextElement.text()).to.eql($firstTextElement.text());

    done();
  });

  it('works with headings', async function () {
    // skip this test in case ep_headings2 isn't installed
    if (!helper.padChrome$.window.clientVars.plugins.plugins.ep_headings2) this.skip();

    const alignment = 'center';
    const inner$ = helper.padInner$;
    const chrome$ = helper.padChrome$;

    // get the first text element out of the inner iframe
    const $firstTextElement = inner$('div').first();

    // select this text element
    $firstTextElement.sendkeys('{selectall}');

    // make it a heading
    chrome$('#heading-selection').val('0');
    chrome$('#heading-selection').change();

    // get the center button and click it
    const $button = chrome$('.ep_align_center');
    $button.click();

    // ace creates a new dom element when you press a button
    // so just get the first text element again
    const $newFirstTextElement = inner$('div').first().first();
    const $alignedSpanStyles = $newFirstTextElement.children().first().attr('style');

    await helper.waitForPromise(() => {
      const alignmentExpr = `text-align: ?${alignment}`;
      return $alignedSpanStyles.search(alignmentExpr) !== -1;
    });

    // make sure the text hasn't changed
    expect($newFirstTextElement.text()).to.eql($firstTextElement.text());
  });
});
