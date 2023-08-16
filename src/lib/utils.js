import path from 'path';
import debug from 'debug';
import * as cheerio from 'cheerio';

const debugHrefLocal = debug('page-loader:href-local');
const debugHref = debug('page-loader:href');

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
  const uri = new URL(link);
  const url = new URL(uri);

  url.hostname = uri.hostname || new URL(host).hostname;
  url.protocol = uri.protocol || new URL(host).protocol;

  return url.toString();
};

export const getLinks = (html, hostname) => {
  const $ = cheerio.load(html);
  const linkList = [];

  for (const [key, value] of Object.entries(sources)) {
    const links = $('html').find(key);

    links
      .filter(tag => $(links[tag]).attr(value))
      .toArray()
      .forEach((link) => {
        const currentLink = getCurrentLink(hostname, link.attribs[value]);

        if (linkList.indexOf(currentLink) === -1) {
          linkList.push(currentLink);
        }
      });
  }

  return linkList;
};

export const setLocalSource = (page, dir, host) => {
  const $ = cheerio.load(page);

  for (const [key, value] of Object.entries(sources)) {
    const links = $('html').find(key);

    links.each((idx) => {
      if ($(links[idx]).attr(value)) {
        const ext = path.extname($(links[idx]).attr(value));
        const currentLink = getCurrentLink(host, $(links[idx]).attr(value));
        const localHREF = path.join(dir, `${getFileName(currentLink)}${ext}`);

        debugHref(currentLink);
        debugHrefLocal(localHREF);

        $(links[idx]).attr(value, localHREF);
      }
    });
  }

  return $.html();
};
