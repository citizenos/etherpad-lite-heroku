'use strict';

const common = require('ep_etherpad-lite/tests/backend/common');
const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;
import {generateJWTToken, generateJWTTokenUser} from "ep_etherpad-lite/tests/backend/common";

let agent;
const apiVersion = 1;

// Creates a pad and returns the pad id. Calls the callback when finished.
const createPad = async (padID, callback) => {
  agent.get(`/api/${apiVersion}/createPad?padID=${padID}`)
    .set("Authorization", await generateJWTToken())
    .end((err, res) => {
      if (err || (res.body.code !== 0)) callback(new Error('Unable to create new Pad'));
      callback(padID);
    });
};

const setHTML = async (padID, html, callback) => {
  agent.get(`/api/${apiVersion}/setHTML?padID=${padID}&html=${html}`)
    .set("Authorization", await generateJWTToken())
    .end((err, res) => {
      if (err || (res.body.code !== 0)) callback(new Error('Unable to set pad HTML'));
      callback(null, padID);
    });
};

const getHTMLEndPointFor =
    (padID, callback) => `/api/${apiVersion}/getHTML?&padID=${padID}`;

const codeToBe = (expectedCode, res) => {
  if (res.body.code !== expectedCode) {
    throw new Error(`Code should be ${expectedCode}, was ${res.body.code}`);
  }
};

const codeToBe0 = (res) => { codeToBe(0, res); };

const buildHTML = (body) => `<html><body>${body}</body></html>`;

const textWithSize = (size, text) => {
  if (!text) text = `this is ${size}`;
  return `<span class='font-size:${size}'>${text}</span>`;
};

const regexWithSize = (size, text) => {
  if (!text) text = `this is ${size}`;
  const regex = `<span .*class=['|"].*font-size:${size}.*['|"].*>${text}</span>`;
  // bug fix: if no other plugin on the Etherpad instance returns a value on getLineHTMLForExport()
  // hook, data-size=(...) won't be replaced by class=size:(...), so we need a fallback regex
  const fallbackRegex = `<span .*data-font-size=['|"]${size}['|"].*>${text}</span>`;
  return `${regex} || ${fallbackRegex}`;
};


describe('ep_font_size - export size styles to HTML', function () {
  let padID;
  let html;

  before(async function () { agent = await common.init(); });

  // create a new pad before each test run
  beforeEach(function (done) {
    padID = randomString(5);

    createPad(padID, () => {
      setHTML(padID, html(), done);
    });
  });

  context('when pad text has one size', function () {
    before(async function () {
      html = () => buildHTML(textWithSize('8'));
    });

    it('returns ok', async function () {
      await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
        .expect(codeToBe0)
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns HTML with size class', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken());
      const expectedRegex = regexWithSize('8');
      const expectedsizes = new RegExp(expectedRegex);
      const html = res.body.data.html;
      const foundsize = html.match(expectedsizes);
      if (!foundsize) {
        throw new Error(
          `size not exported. Regex used: ${expectedRegex}, html exported: ${html}`);
      }
    });
  });

  context('when pad text has two sizes in a single line', function () {
    before(async function () {
      html = () => buildHTML(textWithSize('8') + textWithSize('9'));
    });

    it('returns HTML with two size spans', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken());
      const firstsize = regexWithSize('8');
      const secondsize = regexWithSize('9');
      const expectedRegex = `${firstsize}.*${secondsize}`;
      const expectedsizes = new RegExp(expectedRegex);

      const html = res.body.data.html;
      const foundsize = html.match(expectedsizes);
      if (!foundsize) {
        throw new Error(
          `size not exported. Regex used: ${expectedRegex}, html exported: ${html}`);
      }
    });
  });

  context('when pad text has no sizes', function () {
    before(async function () {
      html = () => buildHTML('empty pad');
    });

    it('returns HTML with no size', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken());
      const expectedRegex = '.*empty pad.*';
      const nosize = new RegExp(expectedRegex);

      const html = res.body.data.html;
      const foundsize = html.match(nosize);
      if (!foundsize) {
        throw new Error('size exported, should not have any. ' +
          `Regex used: ${expectedRegex}, html exported: ${html}`);
      }
    });
  });

  context('when pad text has size inside strong', function () {
    before(async function () {
      html = () => buildHTML(`<strong>${textWithSize('8', 'this is size 8 and bold')}</strong>`);
    });

    // Etherpad exports tags using the order they are defined on the array (bold is always inside
    // size)
    it('returns HTML with strong and size, in any order', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken());
      const txt = 'this is size 8 and bold';
      const strongInside = new RegExp(regexWithSize('8', `<strong>${txt}</strong>`));
      const sizeInside = new RegExp(`<strong>${regexWithSize('8', txt)}</strong>`);
      const html = res.body.data.html;
      const foundsize = html.match(strongInside) || html.match(sizeInside);
      if (!foundsize) {
        throw new Error(`size not exported. Regex used: [${strongInside.source} || ` +
          `${sizeInside.source}], html exported: ${html}`);
      }
    });
  });

  context('when pad text has strong inside size', function () {
    before(async function () {
      html = () => buildHTML(textWithSize('8', '<strong>this is size 8 and bold</strong>'));
    });

    // Etherpad exports tags using the order they are defined on the array (bold is always inside
    // size)
    it('returns HTML with strong and size, in any order', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
      const txt = 'this is size 8 and bold';
      const strongInside = new RegExp(regexWithSize('8', `<strong>${txt}</strong>`));
      const sizeInside = new RegExp(`<strong>${regexWithSize('8', txt)}</strong>`);
      const html = res.body.data.html;
      const foundsize = html.match(strongInside) || html.match(sizeInside);
      if (!foundsize) {
        throw new Error(`size not exported. Regex used: [${strongInside.source} || ` +
          `${sizeInside.source}], html exported: ${html}`);
      }
    });
  });

  context('when pad text has part with size and part without it', function () {
    before(async function () {
      html = () => buildHTML(`no size here ${textWithSize('8')}`);
    });

    it('returns HTML with part with size and part without it', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken());
      const expectedRegex = `no size here ${regexWithSize('8')}`;
      const expectedsizes = new RegExp(expectedRegex);
      const html = res.body.data.html;
      const foundsize = html.match(expectedsizes);
      if (!foundsize) {
        throw new Error(
          `size not exported. Regex used: ${expectedRegex}, html exported: ${html}`);
      }
    });
  });
});
