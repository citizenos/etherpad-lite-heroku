'use strict';

describe('ep_font_size - Set Font size and ensure its removed properly', function () {
  // Tests still to do
  // Ensure additional chars keep the same formatting
  // Ensure heading value is properly set when caret is placed on font size changed content

  // create a new pad before each test run
  beforeEach(async function () {
    this.timeout(60000);
    await helper.aNewPad();
  });

  // Create Pad
  // Select all text
  // Set it to size 9
  // Select all text
  // Set it to size 8

  it('Changes from size 8 to 9 and back to 8', async function () {
    this.timeout(60000);
    const chrome$ = helper.padChrome$;
    const inner$ = helper.padInner$;

    let $firstTextElement = inner$('div').first();

    $firstTextElement.sendkeys('foo');
    $firstTextElement.sendkeys('{selectall}');

    // sets first line to Font size 9
    chrome$('#font-size').val('1');
    chrome$('#font-size').change();

    let fElement = inner$('div').first();
    await helper.waitForPromise(() => {
      const elementHasClass = fElement.children().first().hasClass('font-size:9');
      return expect(elementHasClass).to.be(true);
    });
    $firstTextElement = inner$('div').first();
    $firstTextElement.sendkeys('{selectall}');
    // sets first line to Font size 8
    chrome$('#font-size').val('0');
    chrome$('#font-size').change();
    await helper.waitForPromise(() => {
      fElement = inner$('div').first();
      const elementHasClass = fElement.children().first().hasClass('font-size:8');
      return expect(elementHasClass).to.be(true);
    });
  });

  it('iframe height is correct using very large font, regression for #4914', async function () {
    await helper.clearPad();
    const height = () => parseInt(window.getComputedStyle(
        helper.padOuter$("iframe[name='ace_inner']").get(0)).height);
    expect(height()).to.not.be.above(2000);

    const numLines = 120;
    await helper.edit('\n'.repeat(numLines - 1));
    await helper.edit('Very large text that ideally spans across multiple lines');
    await helper.edit('Another very large text that should span across multiple lines', 80);

    const lines = helper.linesDiv();
    expect(lines.length).to.be(numLines);
    helper.selectLines(lines[0], lines[lines.length - 1]);
    await helper.waitForPromise(() => !helper.padInner$.document.getSelection().isCollapsed);

    // font size 60
    helper.padChrome$('#font-size').val('22');
    helper.padChrome$('#font-size').change();

    // ace_inner should be above 2000px now
    await helper.waitForPromise(() => height() > 2000);
  });
});
