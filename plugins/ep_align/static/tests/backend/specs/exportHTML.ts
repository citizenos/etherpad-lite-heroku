'use strict';

const common = require('ep_etherpad-lite/tests/backend/common');

let agent;
const apiVersion = 1;
const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;
import {generateJWTToken} from "ep_etherpad-lite/tests/backend/common";

// Creates a pad and returns the pad id. Calls the callback when finished.
const createPad = async (padID: string) => {
    const res = await agent.get(`/api/${apiVersion}/createPad?padID=${padID}`)
        .set("Authorization", await generateJWTToken())
    return new Promise((resolve, reject) => {
        if (res.body.code !== 0) {
            reject(new Error('Unable to create new Pad'));
        } else {
            resolve(padID);
        }
    })
};

const setHTML = async (padID: string, html: string) => {
    const newHtml = `/api/${apiVersion}/setHTML?padID=${padID}&html=${html}`
    console.log("New HTML is",newHtml)
    const res = await agent.get(newHtml)
        .set("authorization", await generateJWTToken())
    console.log("Res is",res.body)
    return new Promise((resolve, reject) => {
        if (res.body.code !== 0) {
            reject(new Error('Unable to set pad HTML'));
        } else {
            resolve(padID);
        }
    })
};

const getHTMLEndPointFor = (padID: string) => `/api/${apiVersion}/getHTML?padID=${padID}`;

const buildHTML = (body: string) => `<html><body>${body}</body></html>`;

describe('export alignment to HTML', function () {
  let padID;
  let html;

  before(async function () { agent = await common.init(); });

  // create a new pad before each test run
  beforeEach(async function () {
    padID = randomString(5);
    await createPad(padID);
    await setHTML(padID, html());
  });

  context('when pad text is center aligned', function () {
    before(async function () {
      html = () => buildHTML('<center>Hello world</center>');
    });

    it('returns ok', async function () {
      await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns HTML with Subscript HTML tags', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
      const html = res.body.data.html;
      console.log("Html is",html)

      const expectedHTML =
          '<p style=\'text-align:center\'>Hello world</p><br><br></body></html>';
      if (html.indexOf(expectedHTML) === -1) throw new Error('No center tag detected');
    });
  });

  context('when pad text is justified aligned', function () {
    before(function () {
      html = () => buildHTML('<justify>Hello world</justify>');
    });

    it('returns ok', async function () {
      await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns HTML with Subscript HTML tags', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken());

      const html = res.body.data.html;

      const expectedHTML =
            '<p style=\'text-align:justify\'>Hello world</p><br><br></body></html>';
      if (html.indexOf(expectedHTML) === -1) throw new Error('No center tag detected');
    });
  });

  context('when pad text is right aligned', function () {
    before(async function () {
      html = () => buildHTML('<right>Hello world</right>');
    });

    it('returns ok', async function () {
      await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns HTML with Subscript HTML tags', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken());


          const html = res.body.data.html;
          const expectedHTML =
            '<p style=\'text-align:right\'>Hello world</p><br><br></body></html>';
          if (html.indexOf(expectedHTML) === -1) throw new Error('No right tag detected');
    });
  });

  context('when pad text is left aligned', function () {
    before(async function () {
      html = () => buildHTML('<left>Hello world</left>');
    });

    it('returns ok', async function () {
      await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns HTML with Subscript HTML tags', async function () {
      const res = await agent.get(getHTMLEndPointFor(padID))
        .set("Authorization", await generateJWTToken())
      const html = res.body.data.html;
      const expectedHTML =
            '<p style=\'text-align:left\'>Hello world</p><br><br></body></html>';
          if (html.indexOf(expectedHTML) === -1) throw new Error('No left tag detected');
    });
  });

  context('when pad text is heading', function () {
    before(async function () {
      html = () => buildHTML('<h1><left>Hello world</left></h1>');
    });

    it('returns ok', async function () {
      await agent.get(getHTMLEndPointFor(padID))
          .set("Authorization", await generateJWTToken())
          .expect('Content-Type', /json/)
          .expect(200);
    });

    it('returns HTML with Subscript HTML tags', function () {
      return new Promise<void>((resolve, reject) => {
        try {
          require.resolve('ep_headings2'); // eslint-disable-line n/no-missing-require
          generateJWTToken().then(token => {
            agent.get(getHTMLEndPointFor(padID))
                .set("Authorization", token)
                .end((err, res) => {
                  if (err) {
                    reject(err);
                  } else {
                    const html = res.body.data.html;
                    const expectedHTML = /<h1 +style='text-align:left'>Hello world<\/h1><br><br><\/body><\/html>/;
                    if (html.search(expectedHTML) === -1) {
                      reject(new Error('No left tag detected'));
                    } else {
                      resolve();
                    }
                  }
                });
          }).catch(err => reject(err));
        } catch (e) {
          if (e.message.indexOf('Cannot find module') === -1) {
            reject(new Error(e.message));
          } else {
            resolve();
          }
        }
      });
    });
});
});
