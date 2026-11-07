'use strict';
const appUrl = 'http://localhost:9001';
const apiVersion = 1;

const supertest = require('ep_etherpad-lite/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const api = supertest(appUrl);
const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

// Loads the APIKEY.txt content into a string, and returns it.
const getApiKey = function () {
  const etherpadRoot = '/../../../../../../ep_etherpad-lite/../..';
  const filePath = path.join(__dirname, `${etherpadRoot}/APIKEY.txt`);
  const apiKey = fs.readFileSync(filePath, {encoding: 'utf-8'});
  return apiKey.replace(/\n$/, '');
};

const apiKey = getApiKey();

// Creates a pad and returns the pad id. Calls the callback when finished.
const createPad = (padID, callback) => {
  api.get(`/api/${apiVersion}/createPad?apikey=${apiKey}&padID=${padID}`)
      .end((err, res) => {
        if (err || (res.body.code !== 0)) callback(new Error('Unable to create new Pad'));

        callback(padID);
      });
};

const setHTML = (padID, html, callback) => {
  api.get(`/api/${apiVersion}/setHTML?apikey=${apiKey}&padID=${padID}&html=${html}`)
      .end((err, res) => {
        if (err || (res.body.code !== 0)) callback(new Error('Unable to set pad HTML'));

        callback(null, padID);
      });
};

const getHTMLEndPointFor =
(padID, callback) => `/api/${apiVersion}/getHTML?apikey=${apiKey}&padID=${padID}`;

const codeToBe = (expectedCode, res) => {
  if (res.body.code !== expectedCode) {
    throw new Error(`Code should be ${expectedCode}, was ${res.body.code}`);
  }
};

const codeToBe0 = (res) => { codeToBe(0, res); };

const buildHTML = (body) => `<html><body>${body}</body></html>`;

const textWithColor = (color, text) => {
  if (!text) text = `this is ${color}`;

  return `<span class='color:${color}'>${text}</span>`;
};

const regexWithColor = (color, text) => {
  if (!text) text = `this is ${color}`;

  const regex =
  `<span .*class=['|"].*color:${color}.*['|"].*>${text}</span>`;
  // bug fix: if no other plugin on the Etherpad instance
  // returns a value on getLineHTMLForExport() hook,
  // data-color=(...) won't be replaced by class=color:(...), so we need a fallback regex
  const fallbackRegex = `<span .*data-color=['|"]${color}['|"].*>${text}</span>`;

  return `${regex} || ${fallbackRegex}`;
};

describe('export color styles to HTML', function () {
  let padID;
  let html;

  // create a new pad before each test run
  beforeEach(function (done) {
    padID = randomString(5);

    createPad(padID, () => {
      setHTML(padID, html(), done);
    });
  });

  context('when pad text has one color', function () {
    before(async function () {
      html = () => buildHTML(textWithColor('red'));
    });

    it('returns ok', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect(codeToBe0)
          .expect('Content-Type', /json/)
          .expect(200, done);
    });

    it('returns HTML with color class', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect((res) => {
            const expectedRegex = regexWithColor('red');
            const expectedColors = new RegExp(expectedRegex);
            const html = res.body.data.html;
            const foundColor = html.match(expectedColors);
            if (!foundColor) {
              throw new Error(`Color not exported. Regex used:
                ${expectedRegex}, html exported: ${html}`);
            }
          })
          .end(done);
    });
  });

  context('when pad text has two colors in a single line', function () {
    before(async function () {
      html = () => buildHTML(textWithColor('red') + textWithColor('blue'));
    });

    it('returns HTML with two color spans', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect((res) => {
            const firstColor = regexWithColor('red');
            const secondColor = regexWithColor('blue');
            const expectedRegex = `${firstColor}.*${secondColor}`;
            const expectedColors = new RegExp(expectedRegex);

            const html = res.body.data.html;
            const foundColor = html.match(expectedColors);
            if (!foundColor) {
              throw new Error(`Color not exported. Regex used:
                ${expectedRegex}, html exported: ${html}`);
            }
          })
          .end(done);
    });
  });

  context('when pad text has no colors', function () {
    before(async function () {
      html = () => buildHTML('empty pad');
    });

    it('returns HTML with no color', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect((res) => {
            const expectedRegex = '.*empty pad.*';
            const noColor = new RegExp(expectedRegex);

            const html = res.body.data.html;
            const foundColor = html.match(noColor);
            if (!foundColor) {
              throw new Error(`Color exported, should not have any. Regex used:
                ${expectedRegex}, html exported: ${html}`);
            }
          })
          .end(done);
    });
  });

  context('when pad text has color inside strong', function () {
    before(async function () {
      html = () => buildHTML(`<strong>${textWithColor('red', 'this is red and bold')}</strong>`);
    });

    // Etherpad exports tags using the order they are defined on the array
    // (bold is always inside color)
    it('returns HTML with strong and color, in any order', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect((res) => {
            const strongInsideColorRegex =
            regexWithColor('red', '<strong>this is red and bold</strong>');
            const colorInsideStrongRegex =
            `<strong>${regexWithColor('red', 'this is red and bold')}</strong>`;
            const expectedStrongInsideColor = new RegExp(strongInsideColorRegex);
            const expectedColorInsideStrong = new RegExp(colorInsideStrongRegex);

            const html = res.body.data.html;
            const foundColor =
            html.match(expectedStrongInsideColor) || html.match(expectedColorInsideStrong);
            if (!foundColor) {
              throw new Error(`Color not exported. Regex used:
                [${strongInsideColorRegex} ||
                 ${colorInsideStrongRegex}], html exported: ${html}`);
            }
          })
          .end(done);
    });
  });

  context('when pad text has strong inside color', function () {
    before(async function () {
      html = () => buildHTML(textWithColor('red', '<strong>this is red and bold</strong>'));
    });

    // Etherpad exports tags using the order they are defined on the arra
    // (bold is always inside color)
    it('returns HTML with strong and color, in any order', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect((res) => {
            const strongInsideColorRegex =
            regexWithColor('red', '<strong>this is red and bold</strong>');
            const colorInsideStrongRegex =
            `<strong>${regexWithColor('red', 'this is red and bold')}</strong>`;
            const expectedStrongInsideColor = new RegExp(strongInsideColorRegex);
            const expectedColorInsideStrong = new RegExp(colorInsideStrongRegex);

            const html = res.body.data.html;
            const foundColor = html.match(expectedStrongInsideColor) ||
            html.match(expectedColorInsideStrong);
            if (!foundColor) {
              throw new Error(`Color not exported. Regex used: [${strongInsideColorRegex} ||
                ${colorInsideStrongRegex}], html exported: ${html}`);
            }
          })
          .end(done);
    });
  });

  context('when pad text has part with color and part without it', function () {
    before(async function () {
      html = () => buildHTML(`no color here ${textWithColor('red')}`);
    });


    it('returns HTML with part with color and part without it', function (done) {
      api.get(getHTMLEndPointFor(padID))
          .expect((res) => {
            const expectedRegex = `no color here ${regexWithColor('red')}`;
            const expectedColors = new RegExp(expectedRegex);
            const html = res.body.data.html;
            const foundColor = html.match(expectedColors);
            if (!foundColor) {
              throw new Error(`Color not exported. Regex used:
                ${expectedRegex}, html exported: ${html}`);
            }
          })
          .end(done);
    });
  });
});
