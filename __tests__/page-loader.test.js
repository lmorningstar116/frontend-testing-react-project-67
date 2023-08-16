import fs from 'node:fs';
import os from 'os';
import nock from 'nock';
import path from 'path';
import pageLoader from '../src/index.js';

const getFixturePath = (filename) => path.join(__dirname, '__fixtures__', filename);

const htmlFilePath = getFixturePath('test_page.html');

const address =  'http://localhost/test';

const scriptFileName = 'application.js';
const icoFileName = 'favicon.ico';
const pngFileName = 'favicon-196x196.png';

const scriptFilePath = getFixturePath(`test-page_files/${scriptFileName}`);
const icoFilePath = getFixturePath(`test-page_files/${icoFileName}`);
const pngFilePath = getFixturePath(`test-page_files/${pngFileName}`);

const htmlFile = fs.readFileSync(htmlFilePath, 'utf8');
const scriptFile = fs.readFileSync(scriptFilePath, 'utf8');
const icoFile = fs.readFileSync(icoFilePath, 'utf8');
const pngFile = fs.readFileSync(pngFilePath, 'utf8');

const correctResultHtml = "<html><head>\n" +
  "<title>Test Page</title>\n" +
  `<link href=\"localhost-test_files${path.sep}localhost-blog-about.html\" rel=\"canonical\">\n` +
  "</head>\n" +
  "<body>\n" +
  "<h1>Test</h1>\n" +
  "<p>data</p>\n" +
  "<img>\n" +
  `<link rel=\"shorcut icon\" type=\"image/x-icon\" href=\"localhost-test_files${path.sep}localhost-test-page-files-favicon.ico\">\n` +
  `<img src=\"localhost-test_files${path.sep}localhost-test-page-files-favicon-196x196.png\">\n` +
  `<script src=\"localhost-test_files${path.sep}localhost-test-page-files-application.js\" async=\"async\" crossorigin=\"anonymous\" onload=\"onApplicationJsLoaded(this)\" onerror=\"onScriptLoadError(this)\"></script>\n` +
  "\n" +
  "\n" +
  "</body></html>";


describe('page-loader', () => {
  let dir = '';

  beforeAll(() => {
    dir = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);
  });

  beforeEach(() => {
    nock('http://localhost')
      .get('/test')
      .reply(200, htmlFile)
      .get('/blog/about')
      .reply(200, '<html><head>About</head></html>')
      .get(`/test-page_files/${scriptFileName}`)
      .reply(200, scriptFile)
      .get(`/test-page_files/${icoFileName}`)
      .reply(200, icoFile)
      .get(`/test-page_files/${pngFileName}`)
      .reply(200, pngFile);
  });

  test('correct page', (done) => {
    pageLoader(address, dir)
      .then(() => {
        const dataPage = fs.readFileSync(path.resolve(dir, 'localhost-test.html'), 'utf8');
        expect(dataPage).toBe(correctResultHtml);
        const scriptFileLoaded = fs.readFileSync(path.resolve(dir, 'localhost-test_files', `localhost-test-page-files-${scriptFileName}`));
        expect(scriptFileLoaded).toBeDefined();
        const icoFileLoaded = fs.readFileSync(path.resolve(dir, 'localhost-test_files', `localhost-test-page-files-${icoFileName}`));
        expect(icoFileLoaded).toBeDefined();
        const pngFileLoaded = fs.readFileSync(path.resolve(dir, 'localhost-test_files', `localhost-test-page-files-${pngFileName}`));
        expect(pngFileLoaded).toBeDefined();
        const dataPageAbout = fs.readFileSync(path.resolve(dir, 'localhost-blog-about.html'), 'utf8');
        expect(dataPageAbout).toBe('<html><head>About</head></html>');
      })
      .catch(done.fail)
      .then(done);
  });

  test('wrong address', (done) => {
    pageLoader('wrong_address', dir)
      .catch((err) => {
        expect(err.message).toBe('Incorrect address (must be like \'https://google.com\')');
        done();
      });
  });

  test('wrong pages', (done) => {
    pageLoader('http://localhost/wrong_page', dir)
      .catch((err) => {
        expect(err.statusCode).toBe(404);
        done();
      });
  });

  test('EEXIST', (done) => {
    pageLoader(address, dir)
      .catch((err) => {
        expect(err.code).toBe('EEXIST');
        done();
      });
  })
});
