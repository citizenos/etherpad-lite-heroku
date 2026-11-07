'use strict';

describe('Footnote', function () {
  // create a new pad before each test run
  beforeEach(function (cb) {
    helper.newPad(cb);
    this.timeout(60000);
  });


  it('Add footnote and Check footnote text is present', function (done) {
    const inner$ = helper.padInner$;
    const chrome$ = helper.padChrome$;

    // get the first text element out of the inner iframe
    let $firstTextElement = inner$('div').first();

    // press enter
    $firstTextElement.sendkeys('{enter}');
    // $firstTextElement.sendkeys('{enter}');

    $firstTextElement = inner$('div').first();
    $firstTextElement.sendkeys('{selectall}');

    // get the FN button and click it
    const $fnButton = chrome$('.fnbtn');
    $fnButton.click();

    const fnText = 'Sample Footnote';
    chrome$('#fnInput').val('Sample Footnote');
    const $addButton = chrome$('#fnAdd');
    $addButton.click();

    // check fn is present
    const $fnDomElement = inner$('div:nth-child(2)');
    const isfnPresent = $fnDomElement.find('sup').length === 1;
    expect(isfnPresent).to.be(true);

    const isFootNoteTextPresent = (inner$('div:last-child').text().indexOf(fnText) !== -1);
    expect(isFootNoteTextPresent).to.be(true);
    done();
  });
});
