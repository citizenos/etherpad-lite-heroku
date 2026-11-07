'use strict';

describe('Set Font Color and ensure its removed properly', function () {
  // Tests still to do
  // Ensure additional chars keep the same formatting
  // Ensure heading value is properly set when caret is placed on font color changed content

  // create a new pad before each test run
  beforeEach(function (cb) {
    helper.newPad(cb);
    this.timeout(60000);
  });

  // Create Pad
  // Select all text
  // Set it to Color red
  // Select all text
  // Set it to Color black

  it('Changes from Color black to red and back to black', function (done) {
    this.timeout(60000);
    const chrome$ = helper.padChrome$;
    const inner$ = helper.padInner$;

    let $firstTextElement = inner$('div').first();
    $firstTextElement.sendkeys('foo');
    $firstTextElement.sendkeys('{selectall}');

    // sets first line to Font Color red
    chrome$('.color-selection').val('1');
    chrome$('.color-selection').change();

    let fElement = inner$('div').first();
    helper.waitFor(() => {
      const elementHasClass = fElement.children().first().hasClass('color:red');
      return expect(elementHasClass).to.be(true);
    }).done(() => {
      $firstTextElement = inner$('div').first();

      // sets first line to Font Color black
      chrome$('.color-selection').val('0');
      chrome$('.color-selection').change();
      helper.waitFor(() => {
        fElement = inner$('div').first();
        const elementHasClass = fElement.children().first().hasClass('color:black');
        return expect(elementHasClass).to.be(true);
      }).done(() => {
        done();
      });
    });
  });

  it('Changes color to red selects text again to check selector', function (done) {
    this.timeout(60000);
    const chrome$ = helper.padChrome$;
    const inner$ = helper.padInner$;

    let $firstTextElement = inner$('div').first();
    $firstTextElement.sendkeys('{selectall}');
    $firstTextElement.trigger('click');
    // sets first line to Font Color red
    chrome$('.color-selection').val('1');
    chrome$('.color-selection').change();

    const fElement = inner$('div').first();
    helper.waitFor(() => {
      const elementHasClass = fElement.children().first().hasClass('color:red');
      return expect(elementHasClass).to.be(true);
    }).done(() => {
      $firstTextElement = inner$('div').first();
      $firstTextElement.sendkeys('{rightarrow}');
      $firstTextElement.sendkeys('{leftarrow}');
      helper.waitFor(() => chrome$('.color-selection').val() === '1').done(() => {
        expect(chrome$('.color-selection').val()).to.be('1');
        done();
      });
    });
  });
});
