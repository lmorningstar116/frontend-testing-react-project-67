import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import nock from 'nock';

import loadPage from '../src/index.js';

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

let tempPath;
let expectedHtml;

describe('page-loader', () => {
  const resources = [
    {
      path: '/courses',
      fixture: 'hexlet-courses.html',
      contentType: 'text/html; charset=UTF-8',
      out: 'ru-hexlet-io-courses.html',
    },
    {
      path: '/assets/professions/nodejs.png',
      fixture: 'nodejs.png',
      contentType: 'image/png',
      out: 'ru-hexlet-io-assets-professions-nodejs.png',
    },
    {
      path: '/assets/testing/pyramid.jpeg',
      fixture: 'pyramid.jpeg',
      contentType: 'image/jpeg',
      out: 'ru-hexlet-io-assets-testing-pyramid.jpeg',
    },
    {
      path: '/assets/application.css',
      fixture: 'application.css',
      contentType: 'text/css',
      out: 'ru-hexlet-io-assets-application.css',
    },
    {
      path: '/packs/js/runtime.js',
      fixture: 'runtime.js',
      contentType: 'text/javascript',
      out: 'ru-hexlet-io-packs-js-runtime.js',
    },
  ];

  beforeAll(() => {
    nock.disableNetConnect();
  });

  beforeEach(async () => {
    tempPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('positive cases', () => {
    beforeEach(async () => {
      expectedHtml = await fs.readFile(getFixturePath('/expected/hexlet-courses-result.html'), 'utf-8');

      resources.forEach((resource) => {
        nock('https://ru.hexlet.io')
          .persist()
          .get(resource.path)
          .replyWithFile(200, getFixturePath(resource.fixture), {
            'Content-Type': resource.contentType,
          });
      });
    });

    it('should download page with resources', async () => {
      const { filepath } = await loadPage('https://ru.hexlet.io/courses', tempPath);
      const resultHtml = await fs.readFile(filepath, 'utf-8');

      expect(resultHtml).toEqual(expectedHtml);
      expect(resultHtml.localeCompare(expectedHtml) === 0).toBeTruthy();

      await Promise.all(resources.map(async (asset) => {
        const expectedFile = await fs.readFile(getFixturePath(asset.fixture));
        const resultFile = await fs.readFile(path.join(tempPath, 'ru-hexlet-io-courses_files', asset.out));

        expect(expectedFile.equals(resultFile)).toBeTruthy();
      }));
    });
  });

  describe('negative cases', () => {
    const errCodes = {
      401: 'ERR_BAD_REQUEST',
      403: 'ERR_BAD_REQUEST',
      404: 'ERR_BAD_REQUEST',
      500: 'ERR_BAD_RESPONSE',
    };

    beforeEach(async () => {
      nock('https://ru.hexlet.io')
        .get('/courses')
        .replyWithFile(200, getFixturePath('hexlet-courses.html'), {
          'Content-Type': 'text/html; charset=UTF-8',
        });
    });

    it('should handle filesystem errors', async () => {
      await expect(loadPage('https://ru.hexlet.io/courses', 'notExistPath')).rejects.toEqual('ERR_INVALID_ARG_TYPE');
    });

    it('should handle filesystem error (file instead directory)', async () => {
      const file = `${tempPath}/test-file.txt`;

      await fs.writeFile(file, 'test');

      await expect(loadPage('https://ru.hexlet.io/courses', file)).rejects.toEqual('ERR_INVALID_ARG_TYPE');
    });

    it.each(
      Object
        .keys(errCodes)
        .map((code) => Number(code)),
    )('should handle %d errors', async (errorCode) => {
      nock('https://ru.hexlet.io')
        .get('/pagewitherror')
        .reply(errorCode);

      await expect(loadPage('https://ru.hexlet.io/pagewitherror', tempPath)).rejects.toEqual(errCodes[errorCode]);
    });
  });
});
