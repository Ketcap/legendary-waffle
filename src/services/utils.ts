import fetch from 'node-fetch';
import cheerio from 'cheerio';

type Item = {
  title: string;
  oldPrice: string;
  newPrice: string;
  url: string;
};

export const replaceUrlParam = (url: string, nextPageUrl: string) => {
  if (!nextPageUrl) {
    return '';
  }
  const splitUrl = url.split('/');
  splitUrl[splitUrl.length - 1] = nextPageUrl;
  return [...splitUrl].join('/');
};

export const findItems = async ($: cheerio.Root) => {
  return $('ul#PDL li')
    .toArray()
    .map<Item>((element) => {
      const itemElement = $(element);

      const url = itemElement.find('a:first-of-type').attr('href') ?? '';
      const title = itemElement.find('article h3.pn_v8').text();
      const oldPrice = itemElement.find('article span.ppt_v8 i').text();
      const newPrice = itemElement.find('article span.pb_v8 span').text();

      return {
        title,
        url: `https://www.akakce.com${url}`,
        oldPrice,
        newPrice,
      };
    });
};

export const fetchPage = async (url: string) => {
  const siteHtml = await fetch(url).then((e) => e.text());
  return siteHtml;
};

export const gatherItems = async (url: string, items: Item[]): Promise<Item[]> => {
  if (!url) {
    return items;
  }
  const siteHtml = await fetchPage(url);
  const $ = cheerio.load(siteHtml);

  const nextPageUrl = $('.pager_v8 a:last-of-type').attr('href') ?? '';

  const replacedUrl = replaceUrlParam(url, nextPageUrl);

  const foundItems = await findItems($);

  return gatherItems(replacedUrl, [...items, ...foundItems]);
};

const groupKeys = ['3060', '3070', '3080'];

type GroupedItems = {
  [key: string]: Item[];
};

const reducerDefault = groupKeys.reduce<GroupedItems>(
  (state, cur) => ({
    ...state,
    [cur]: [],
  }),
  {}
);

export const groupItems = (items: Item[]) => {
  return items.reduce<GroupedItems>((state, cur) => {
    const key = groupKeys.find((groupKey) => (cur.title ?? '').includes(groupKey));
    if (!key) return state;
    return {
      ...state,
      [key]: [...state[key], cur],
    };
  }, reducerDefault);
};

const ESCAPE_CHARACTERS = [
  '_',
  '*',
  '[',
  ']',
  '(',
  ')',
  '~',
  '`',
  '>',
  '#',
  '+',
  '-',
  '=',
  '|',
  '{',
  '}',
  '.',
  '!',
];
export const escapeCharacters = (a: string) => {
  return ESCAPE_CHARACTERS.reduce((escapingString, cur) => {
    const reg = `\\${cur}`;
    const regexp = new RegExp(reg, 'g');
    return escapingString.replace(regexp, `\\${cur}`);
  }, a);
};

export const formatItems = (items: GroupedItems) => {
  return Object.keys(items).reduce((state, cur) => {
    const title = cur;

    const content = items[cur].reduce((contentState, contentCurrent) => {
      const item = `[${escapeCharacters(contentCurrent.title)}](${
        contentCurrent.url
      }), ~${escapeCharacters(contentCurrent.oldPrice)}~ ${escapeCharacters(
        contentCurrent.newPrice
      )}`;

      return `${contentState}\n${item}`;
    }, ``);

    return `${state}\n*${title}*\n${content}
    `;
  }, ``);
};
