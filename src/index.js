import axios from 'axios';
import fs from 'mz/fs.js';
import path from 'path';
import debug from 'debug';
import os from 'os';
import axiosDebugLogEnable from 'axios-debug-log/enable.js';

import {getFileName, setLocalSource} from "./lib/utils.js";
import {sourceLoader} from "./lib/sourceLoader.js";

const log = debug('page-loader');

export default (address, dir = '.', task = undefined) => {
  let filePageName;
  let filesDir;
  let tempDir;

  return Promise.resolve()
    .then(() => getFileName(address))
    .then((filename) => {
      filePageName = filename;
      return true;
    })
    .then(() => fs.mkdtemp(`${os.tmpdir()}${path.sep}`))
    .then((tmpPath) => {
      tempDir = tmpPath;
      filesDir = path.resolve(tempDir, `${filePageName}_files`);
    })
    .then(() => axios.get(address))
    .then((response) => {
      log(`address: '${address}'`);
      log(`output: '${dir}'`);
      log('Page have been loaded.');

      const page = setLocalSource(response.data, `${filePageName}_files`, address);
      log('Links have been replaced to local files.');
      const promisePageSave = fs.writeFile(path.resolve(tempDir, `${filePageName}.html`), page)
        .then(() => log('Page have been saved.'));
      const promiseFilesSave = fs.mkdir(filesDir)
        .then(() => log(`Dir '${filesDir}' created.`))
        .then(() => sourceLoader(response.data, address, task))
        .then((files) => {
          const promises = files.map((file) => {
            const filePath = path.resolve(filesDir, file.pathSave);

            return fs.writeFile(filePath, file.data)
              .then(() => {
                log(`File saved '${file.pathSave}'`);
                log(`path: '${filePath}'`);
                return file.url;
              });
          });
          return Promise.all(promises);
        })
        .then(() => log('Resources have been saved.'));

      return Promise.all([promiseFilesSave, promisePageSave])
        .then(() => fs.readFile(path.resolve(tempDir, `${filePageName}.html`)))
        .then(data => fs.writeFile(path.resolve(dir, `${filePageName}.html`), data))
        .then(() => fs.mkdir(path.resolve(dir, `${filePageName}_files`)))
        .then(() => fs.readdir(filesDir))
        .then((files) => {
          const promises = files.map((file) => {
            const name = path.basename(file);
            return fs.readFile(path.resolve(filesDir, file))
              .then(data => fs.writeFile(path.resolve(dir, `${filePageName}_files`, name), data));
          });
          return Promise.all(promises);
        });
    })
    .then(() => ({ filepath: path.resolve(dir, `${filePageName}.html`) }));
}
