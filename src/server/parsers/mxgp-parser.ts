import * as cheerio from "cheerio";
import type { Parser, ParseResult, ParsedArticle } from "./types";
import { htmlToPlainText } from "@/lib/html";

const MXGP_BASE_URL = "https://www.mxgp.com";
const MXGP_NEWS_URL = "https://www.mxgp.com/news";
const PAGES_TO_FETCH = 3;

export class MxgpParser implements Parser {
  readonly key = "mxgp";

  async parse(): Promise<ParseResult> {
    const errors: string[] = [];
    const articles: ParsedArticle[] = [];
    const seenUrls = new Set<string>();

    for (let page = 0; page < PAGES_TO_FETCH; page++) {
      try {
        const url = page === 0 ? MXGP_NEWS_URL : `${MXGP_NEWS_URL}?page=${page}`;
        const html = await this.fetchPage(url);
        const pageArticles = this.parseListingPage(html);

        for (const article of pageArticles) {
          if (!seenUrls.has(article.url)) {
            seenUrls.add(article.url);
            articles.push(article);
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : `Failed to fetch page ${page}`;
        errors.push(`[page ${page}]: ${message}`);
      }
    }

    // Enrich with article detail content
    const enriched = await this.enrichArticles(articles, errors);
    return { articles: enriched, errors };
  }

  private parseListingPage(html: string): ParsedArticle[] {
    const $ = cheerio.load(html);
    const articles: ParsedArticle[] = [];

    $(".views-row").each((_, el) => {
      const row = $(el);

      const titleEl = row.find(".views-field-title a, .field-name-title a");
      const title = titleEl.text().trim();
      const href = titleEl.attr("href");

      if (!title || !href) return;

      const url = href.startsWith("http")
        ? href
        : `${MXGP_BASE_URL}${href}`;

      // Get teaser text
      const teaser = row.find(".views-field-body .field-content").text().trim();

      // Get image
      const imgEl = row.find("img[typeof='foaf:Image']");
      const imgSrc = imgEl.attr("src");
      const imageUrl = imgSrc
        ? imgSrc.startsWith("http")
          ? imgSrc
          : `${MXGP_BASE_URL}${imgSrc}`
        : null;

      // Extract date from teaser text (pattern: "26th March 2026" or "22 March 2026")
      const publishedAt = this.extractDateFromText(teaser);

      articles.push({
        title: this.normalizeTitle(title),
        url,
        publishedAt,
        contentHtml: null,
        contentText: teaser || null,
        imageUrl: imageUrl ? this.upgradeImageUrl(imageUrl) : null,
        sport: "motocross",
        category: "news",
      });
    });

    return articles;
  }

  private async enrichArticles(
    articles: ParsedArticle[],
    errors: string[]
  ): Promise<ParsedArticle[]> {
    const enriched: ParsedArticle[] = [];
    const BATCH_SIZE = 4;

    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((a) => this.fetchArticleDetail(a))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled") {
          enriched.push(result.value);
        } else {
          enriched.push(batch[j]);
          errors.push(
            `[detail] ${batch[j].title.slice(0, 40)}: ${result.reason}`
          );
        }
      }
    }

    return enriched;
  }

  private async fetchArticleDetail(
    article: ParsedArticle
  ): Promise<ParsedArticle> {
    const html = await this.fetchPage(article.url);
    const $ = cheerio.load(html);

    const bodyEl = $(".field-name-body-default");
    const contentHtml = bodyEl.html()?.trim() || null;
    const contentText = contentHtml ? htmlToPlainText(contentHtml) : null;

    // Get full-size image from article page
    const fullImg = $(".field-name-field-news-image img").attr("src");
    const imageUrl = fullImg
      ? fullImg.startsWith("http")
        ? fullImg
        : `${MXGP_BASE_URL}${fullImg}`
      : article.imageUrl;

    // Try to extract date from content
    const publishedAt =
      article.publishedAt || this.extractDateFromText(contentText ?? "");

    return {
      ...article,
      contentHtml: contentHtml ?? article.contentHtml,
      contentText: contentText ?? article.contentText,
      imageUrl: imageUrl ?? article.imageUrl,
      publishedAt,
    };
  }

  private extractDateFromText(text: string): string | null {
    // Pattern: "26th March 2026" or "22 March 2026" or "March 22, 2026"
    const patterns = [
      /(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[0].replace(/(?:st|nd|rd|th)/i, "");
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date.toISOString();
      }
    }

    return null;
  }

  private normalizeTitle(title: string): string {
    // MXGP titles are often ALL CAPS — convert to title case
    if (title === title.toUpperCase() && title.length > 10) {
      return title
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\bMxgp\b/g, "MXGP")
        .replace(/\bMx2\b/g, "MX2")
        .replace(/\bFim\b/g, "FIM")
        .replace(/\bMxon\b/g, "MXoN")
        .replace(/\bIxs\b/g, "IXS")
        .replace(/\bTv\b/g, "TV");
    }
    return title;
  }

  private upgradeImageUrl(url: string): string {
    // Replace thumbnail size with larger version
    return url.replace(/list_item_234x149/, "list_page_default");
  }

  private async fetchPage(url: string): Promise<string> {
    // MXGP.com has an incomplete SSL certificate chain
    const prevTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`);
      }

      return response.text();
    } finally {
      if (prevTls !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTls;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }
  }
}
