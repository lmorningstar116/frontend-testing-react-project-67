import path from 'path';
import debug from 'debug';
import * as cheerio from 'cheerio';

const log = debug('page-loader');

export const sources =  {
  link: 'href',
  script: 'src',
  img: 'src'
}

export const getFileName = (address) => {
  try {
    const url = new URL(address);

    if (!url.hostname) {
      throw new Error('Incorrect address (must be like \'https://google.com\')');
    }

    const pathname = url.pathname.split('.');

    return `${url.hostname}${pathname[0] || ''}`.replace(/[^0-9a-z]/gi, '-');
  } catch {
    throw new Error('Incorrect address (must be like \'https://google.com\')');
  }
}

export const getCurrentLink = (host, link) => {
  if (new RegExp(/^https?:\/\//).test(link)) {
    const uri = new URL(link);

    const url = new URL(uri);

    url.hostname = uri.hostname || new URL(host).hostname;
    url.protocol = uri.protocol || new URL(host).protocol;

    return url.toString();
  } else {
    const url = new URL(host);

    url.pathname = link;

    return url.toString();
  }
};

export const getLinks = (html, hostname) => {
  const hostNameURI = new URL(hostname);

  const $ = cheerio.load(html);
  const linkList = [];

  for (const [key, value] of Object.entries(sources)) {
    const links = $('html').find(key);

    links
      .filter(tag => $(links[tag]).attr(value))
      .toArray()
      .forEach((link) => {
        const currentLink = getCurrentLink(hostname, link.attribs[value]);

        const currURI = new URL(currentLink);

        if (currURI.hostname === hostNameURI.hostname && linkList.indexOf(currentLink) === -1) {
          linkList.push(currentLink);
        }
      });
  }

  return linkList;
};

export const setLocalSource = (page, dir, host) => {
  const hostNameURI = new URL(host);

  const $ = cheerio.load(page);

  for (const [key, value] of Object.entries(sources)) {
    const links = $('html').find(key);

    links.each((idx) => {
      if ($(links[idx]).attr(value)) {
        let ext = path.extname($(links[idx]).attr(value));

        if (ext === '') {
          ext = '.html';
        }

        const currentLink = getCurrentLink(host, $(links[idx]).attr(value));
        const currURI = new URL(currentLink);

        if (currURI.hostname === hostNameURI.hostname) {
          const localHREF = path.join(dir, `${getFileName(currentLink)}${ext}`);

          log(currentLink);
          log(localHREF);

          $(links[idx]).attr(value, localHREF);
        }
      }
    });
  }

  return $.html();
};
