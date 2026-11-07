'use strict';

describe('ep_font_size - Select font-size dropdown localization', function () {
  const changeEtherpadLanguageTo = async (lang) => {
    const boldTitles = {
      en: 'Bold (Ctrl+B)',
      fr: 'Gras (Ctrl + B)',
    };
    const chrome$ = helper.padChrome$;

    // click on the settings button to make settings visible
    const $settingsButton = chrome$('.buttonicon-settings');
    $settingsButton.click();

    // select the language
    const $language = chrome$('#languagemenu');
    $language.val(lang);
    $language.change();

    // hide settings again
    $settingsButton.click();

    await helper.waitForPromise(
        () => chrome$('.buttonicon-bold').parent()[0].title === boldTitles[lang]);
  };

  // create a new pad with comment before each test run
  beforeEach(async function () {
    this.timeout(60000);
    await helper.aNewPad();
    await changeEtherpadLanguageTo('fr');
  });

  // ensure we go back to English to avoid breaking other tests:
  after(async function () {
    await changeEtherpadLanguageTo('en');
  });

  it('Localizes dropdown when Etherpad language is changed', async function () {
    const optionTranslations = {
      'ep_font_size.size': 'Taille de police',
    };
    const chrome$ = helper.padChrome$;
    const $option = chrome$('#editbar').find('#font-size').find('option').first();

    expect($option.text()).to.be(optionTranslations[$option.attr('data-l10n-id')]);
  });
});
