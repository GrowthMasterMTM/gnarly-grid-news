import * as cheerio from "cheerio";

export function htmlToPlainText(html: string): string {
  const $ = cheerio.load(html, null, false);
  return $.text().replace(/\s+/g, " ").trim();
}

export function decodeHtmlEntities(str: string): string {
  const $ = cheerio.load(`<span>${str}</span>`, null, false);
  return $("span").text();
}
