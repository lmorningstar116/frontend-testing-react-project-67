import fs from 'fs';
import os from 'os';
import path from 'path';
import nock from 'nock';

import pageLoader from '../src/index.js';

nock.disableNetConnect();

const fixDirname = '__fixtures__';

const baseUrl = 'https://ru.hexlet.io';
const pagePath = '/courses';
const pageUrl = `${baseUrl}${pagePath}`;

const imgPathReq = '/assets/professions/nodejs.png';
const scriptPathReq = '/packs/js/runtime.js';
const stylePathReq = '/assets/application.css';
const canonicalPathReq = '/courses';

const pageName = 'ru-hexlet-io-courses';
const ext = '.html';

const filesDir = `${pageName}_files`;
const imgName = 'ru-hexlet-io-assets-professions-nodejs.png';
const scriptName = 'ru-hexlet-io-packs-js-runtime.js';
const styleName = 'ru-hexlet-io-assets-application.css';
const canonicalName = 'ru-hexlet-io-courses.html';

let tmpDirPath = '';

// const formatHTML = (str) => format(str, { parser: 'html' });

const getFixturePath = (filename) => path.join(__dirname, '..', fixDirname, filename);

beforeEach(async () => {
  tmpDirPath = fs.mkdtempSync(path.join(os.tmpdir(), 'page-loader-'));
});
test('correctly loading', async () => {
  const testPage = fs.readFileSync(getFixturePath(`${pageName}${ext}`), 'utf8');
  const image = fs.readFileSync(getFixturePath(`${filesDir}/${imgName}`), 'utf8');
  const script = fs.readFileSync(getFixturePath(`${filesDir}/${scriptName}`), 'utf8');
  const style = fs.readFileSync(getFixturePath(`${filesDir}/${styleName}`), 'utf8');
  const canonical = fs.readFileSync(getFixturePath(`${filesDir}/${canonicalName}`), 'utf8');

  nock(baseUrl)
    .get(pagePath)
    .reply(200, testPage)
    .get(imgPathReq)
    .reply(200, image)
    .get(scriptPathReq)
    .reply(200, script)
    .get(stylePathReq)
    .reply(200, style)
    .get(canonicalPathReq)
    .reply(200, canonical);

  await expect(pageLoader(pageUrl, tmpDirPath)).resolves.toEqual({ filepath: path.join(tmpDirPath, `${pageName}${ext}`) });

  const expectedPage = fs.readFileSync(getFixturePath('expected.html'), 'utf8');
  const actualPage = fs.readFileSync(path.join(tmpDirPath, `${pageName}${ext}`), 'utf8');
  const downloadedImage = fs.readFileSync(path.join(tmpDirPath, `${filesDir}/${imgName}`), 'utf8');
  const downloadedScript = fs.readFileSync(path.join(tmpDirPath, `${filesDir}/${scriptName}`), 'utf8');
  const downloadedStyle = fs.readFileSync(path.join(tmpDirPath, `${filesDir}/${styleName}`), 'utf8');
  const downloadedCanonical = fs.readFileSync(path.join(tmpDirPath, `${filesDir}/${canonicalName}`), 'utf8');

  // expect(formatHTML(actualPage)).toEqual(formatHTML(expectedPage));
  expect(actualPage).toEqual(expectedPage);
  expect(downloadedImage).toEqual(image);
  expect(downloadedScript).toEqual(script);
  expect(downloadedStyle).toEqual(style);
  expect(downloadedCanonical).toEqual(canonical);
});

test('bad request', async () => {
  nock('http://my.url')
    .get('/not-exist-page')
    .reply(404, '');
  await expect(pageLoader('http://my.url/not-exist-page', tmpDirPath)).rejects.toThrow();
});

test('bad url', async () => {
  nock('http:/my.url')
    .get(pagePath)
    .reply(404, '');
  await expect(pageLoader('http:/my.url/not-exist-page', tmpDirPath)).rejects.toThrow();
});

test('output path not exist', async () => {
  nock(baseUrl)
    .get(pagePath)
    .reply(200, 'data');

  await expect(pageLoader(pageUrl, 'notExistPath')).rejects.toThrow();
});
