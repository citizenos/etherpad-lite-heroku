'use strict';

describe('Align Localization', function () {
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

  it('localizes toolbar buttons when Etherpad language is changed', async function () {
    const buttonTranslations = {
      'ep_align.toolbar.left.title': 'À gauche',
      'ep_align.toolbar.center.title': 'Centré',
      'ep_align.toolbar.right.title': 'À droite',
      'ep_align.toolbar.justify.title': 'Justifié',
    };
    const chrome$ = helper.padChrome$;
    const $buttons = chrome$('#editbar').find('.ep_align').parent();
    $buttons.each(function (index) {
      console.log($(this).attr('data-l10n-id'), $(this).attr('title'));
      const $key = $(this).attr('data-l10n-id');
      const $title = $(this).attr('title');
      console.log($title === buttonTranslations[$key]);
      expect($title).to.be(buttonTranslations[$key]);
    });
  });
});
