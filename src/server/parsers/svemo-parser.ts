import * as cheerio from "cheerio";
import type { Parser, ParseResult, ParsedArticle } from "./types";
import { htmlToPlainText, decodeHtmlEntities } from "@/lib/html";

const SVEMO_NEWS_URL = "https://www.svemo.se/nyheter/";
const SVEMO_BASE_URL = "https://www.svemo.se";

interface SvemoNewsItem {
  id: number;
  date: string;
  slug: string;
  link: string;
  title: { rendered: string };
  sports: Array<{ name: string; slug: string }>;
  newscategories: Array<{ name: string; slug: string }>;
  featured_media:
    | false
    | {
        url: string;
        alt: string;
        sizes?: {
          large?: string;
          medium_large?: string;
          medium?: string;
        };
      };
  acf?: {
    blocks?: Array<{
      acf_fc_layout: string;
      content_blocks?: Array<SvemoContentBlock>;
    }>;
  };
}

type SvemoContentBlock =
  | { acf_fc_layout: "paragraph"; text: string }
  | { acf_fc_layout: "content_hero"; title: string; subtitle?: string }
  | {
      acf_fc_layout: "image_block";
      image?: { url: string; alt: string };
    }
  | { acf_fc_layout: "code_block"; code: string }
  | { acf_fc_layout: string; [key: string]: unknown };

export class SvemoParser implements Parser {
  readonly key = "svemo";

  async parse(): Promise<ParseResult> {
    const errors: string[] = [];
    const articles: ParsedArticle[] = [];

    let nextData: { props?: { pageProps?: { news?: SvemoNewsItem[] } } };

    try {
      const html = await this.fetchPage(SVEMO_NEWS_URL);
      nextData = this.extractNextData(html);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch Svemo news page";
      return { articles: [], errors: [message] };
    }

    const newsItems = nextData?.props?.pageProps?.news;
    if (!newsItems || !Array.isArray(newsItems)) {
      return {
        articles: [],
        errors: ["No news items found in __NEXT_DATA__"],
      };
    }

    for (const item of newsItems) {
      try {
        const article = this.transformItem(item);
        if (article) {
          articles.push(article);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown transform error";
        errors.push(`Failed to transform article ${item.slug}: ${message}`);
      }
    }

    return { articles, errors };
  }

  private transformItem(item: SvemoNewsItem): ParsedArticle | null {
    const title = this.decodeHtml(item.title.rendered).trim();
    if (!title) return null;

    const url = item.link.startsWith("http")
      ? item.link
      : `${SVEMO_BASE_URL}${item.link}`;

    const { html, text } = this.extractContent(item);
    const imageUrl = this.extractImage(item);
    const sport = this.mapSport(item.sports);
    const category = this.mapCategory(item.newscategories);

    return {
      title,
      url,
      publishedAt: item.date || null,
      contentHtml: html || null,
      contentText: text || null,
      imageUrl,
      sport,
      category,
    };
  }

  private extractContent(item: SvemoNewsItem): {
    html: string;
    text: string;
  } {
    const htmlParts: string[] = [];
    const textParts: string[] = [];

    const blocks = item.acf?.blocks;
    if (!blocks) return { html: "", text: "" };

    for (const block of blocks) {
      if (!block.content_blocks) continue;

      for (const cb of block.content_blocks) {
        switch (cb.acf_fc_layout) {
          case "paragraph": {
            const paragraphBlock = cb as { text: string };
            if (paragraphBlock.text) {
              htmlParts.push(paragraphBlock.text);
              textParts.push(this.htmlToText(paragraphBlock.text));
            }
            break;
          }
          case "content_hero": {
            const heroBlock = cb as { title: string; subtitle?: string };
            if (heroBlock.title) {
              htmlParts.push(`<h2>${heroBlock.title}</h2>`);
              textParts.push(heroBlock.title);
            }
            if (heroBlock.subtitle) {
              htmlParts.push(`<p>${heroBlock.subtitle}</p>`);
              textParts.push(heroBlock.subtitle);
            }
            break;
          }
        }
      }
    }

    return {
      html: htmlParts.join("\n"),
      text: textParts.join("\n\n").trim(),
    };
  }

  private extractImage(item: SvemoNewsItem): string | null {
    if (!item.featured_media) return null;

    const media = item.featured_media;
    return (
      media.sizes?.large ??
      media.sizes?.medium_large ??
      media.url ??
      null
    );
  }

  private mapSport(
    sports: Array<{ name: string; slug: string }>
  ): string {
    if (!sports || sports.length === 0) return "general";

    const sportSlugs = sports.map((s) => s.slug.toLowerCase());

    if (sportSlugs.some((s) => s.includes("enduro"))) return "enduro";
    if (
      sportSlugs.some(
        (s) => s.includes("motocross") || s.includes("mx")
      )
    )
      return "motocross";
    if (sportSlugs.some((s) => s.includes("trial"))) return "trial";
    if (sportSlugs.some((s) => s.includes("supermoto"))) return "supermoto";

    return "general";
  }

  private mapCategory(
    categories: Array<{ name: string; slug: string }>
  ): string {
    if (!categories || categories.length === 0) return "news";

    const catSlugs = categories.map((c) => c.slug.toLowerCase());

    if (catSlugs.some((c) => c.includes("resultat") || c.includes("result")))
      return "results";
    if (catSlugs.some((c) => c.includes("intervju") || c.includes("interview")))
      return "interview";

    return "news";
  }

  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "GnarlyGridNews/1.0 (motorsport news aggregator)",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url}`);
    }

    return response.text();
  }

  private extractNextData(html: string): Record<string, unknown> {
    const $ = cheerio.load(html);
    const scriptTag = $('script#__NEXT_DATA__[type="application/json"]');

    if (!scriptTag.length) {
      throw new Error("No __NEXT_DATA__ script tag found");
    }

    const raw = scriptTag.text();
    return JSON.parse(raw) as Record<string, unknown>;
  }

  private htmlToText(html: string): string {
    return htmlToPlainText(html);
  }

  private decodeHtml(str: string): string {
    return decodeHtmlEntities(str);
  }
}
