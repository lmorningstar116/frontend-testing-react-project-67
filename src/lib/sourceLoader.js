import path from 'path';
import axios from "axios";
import debug from 'debug';

import {getFileName, getLinks} from "./utils.js";

const sourcesDebug = debug('page-loader:src');
const sourceFailLoad = debug('page-loader:src_fail_load');

export const sourceLoader = (html, hostname, task) => {
  const links = getLinks(html, hostname);
  const promises = links.map((link) => {
    if (task) {
      return Promise.resolve(task(link, axios.get, { responseType: 'arraybuffer' }));
    }

    return axios.get(link, { responseType: 'arraybuffer' })
      .catch((err) => {
        sourceFailLoad(err);
        return err;
      });
  });
  return Promise.all(promises)
    .then(data => data.filter(file => file))
    .then(data => data.map((file) => {
      sourcesDebug(`loaded file '${file.config.url}'`);
      const ext = path.extname(file.config.url);
      const pathSave = `${getFileName(file.config.url)}${ext}`;
      return { pathSave, data: file.data, url: file.config.url };
    }));
};
