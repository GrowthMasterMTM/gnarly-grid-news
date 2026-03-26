import * as cheerio from "cheerio";
import type { Parser, ParseResult, ParsedArticle } from "./types";

const FIM_BASE_URL = "https://www.fim-moto.com";
const FIM_SOLR_BASE =
  "https://www.fim-moto.com/en/news?" +
  "tx_solr%5Bcontroller%5D=Search&" +
  "tx_solr%5Bq%5D=&" +
  "tx_solr%5Bview%5D=news&" +
  "tx_typoscriptrendering%5Bcontext%5D=" +
  "%7B%22record%22%3A%22pages_8%22%2C%22path%22%3A%22tt_content.list.20.solr_pi_results%22%7D&" +
  "cHash=4eb41cd6cfb7c69892966ca69bc27db3";

interface FimParserOptions {
  key: string;
  disciplineFilter?: string;
  defaultSport?: string;
  pagesToFetch?: number;
}

export class FimParser implements Parser {
  readonly key: string;
  private readonly disciplineFilter: string | null;
  private readonly defaultSport: string;
  private readonly pagesToFetch: number;

  constructor(options?: FimParserOptions) {
    this.key = options?.key ?? "fim-news";
    this.disciplineFilter = options?.disciplineFilter ?? null;
    this.defaultSport = options?.defaultSport ?? "general";
    this.pagesToFetch = options?.pagesToFetch ?? 5;
  }

  private get solrUrl(): string {
    if (!this.disciplineFilter) return FIM_SOLR_BASE;
    return `${FIM_SOLR_BASE}&tx_solr%5Bfilter%5D%5B0%5D=discipline%3A${encodeURIComponent(this.disciplineFilter)}`;
  }

  async parse(): Promise<ParseResult> {
    const errors: string[] = [];
    const articles: ParsedArticle[] = [];
    const seenUrls = new Set<string>();

    for (let page = 1; page <= this.pagesToFetch; page++) {
      try {
        const url =
          page === 1
            ? this.solrUrl
            : `${this.solrUrl}&tx_solr%5Bpage%5D=${page}`;
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

    const articlesWithContent = await this.enrichArticles(articles, errors);

    return { articles: articlesWithContent, errors };
  }

  private parseListingPage(html: string): ParsedArticle[] {
    const $ = cheerio.load(html, null, false);
    const articles: ParsedArticle[] = [];

    $("div.card[class*='news-']").each((_, el) => {
      const card = $(el);

      const title = card.find("p.title").text().trim();
      const linkEl = card.find("a.stretched-link");
      const href = linkEl.attr("href");
      const dateStr = card.find("time[datetime]").attr("datetime");
      const imgSrc = card.find("img.img-fluid").attr("src");
      const breadcrumb = card.find("ul.breadcrumb li").text().trim();
      const teaser = card.find(".teaser p").text().trim();

      if (!title || !href) return;

      const url = href.startsWith("http")
        ? href
        : `${FIM_BASE_URL}${href}`;

      const publishedAt = this.parseDate(dateStr ?? null);
      const imageUrl = imgSrc
        ? imgSrc.startsWith("http")
          ? imgSrc
          : `${FIM_BASE_URL}${imgSrc}`
        : null;

      const sport = this.mapSport(breadcrumb);

      articles.push({
        title,
        url,
        publishedAt,
        contentHtml: null,
        contentText: teaser || null,
        imageUrl,
        sport,
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
    const BATCH_SIZE = 5;

    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((article) => this.fetchArticleDetail(article))
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

    const bodyEl = $('div[itemprop="articleBody"]');
    const contentHtml = bodyEl.html()?.trim() || null;
    const contentText = bodyEl.text().replace(/\s+/g, " ").trim() || null;

    const dateEl = $('time[itemprop="datePublished"]');
    const articleDate = dateEl.attr("datetime");
    const publishedAt = articleDate
      ? new Date(articleDate).toISOString()
      : article.publishedAt;

    const ogImage = $('meta[property="og:image"]').attr("content");
    const imageUrl =
      article.imageUrl ??
      (ogImage
        ? ogImage.startsWith("http")
          ? ogImage
          : `${FIM_BASE_URL}${ogImage}`
        : null);

    const galleryImg = $("div.news-details-gallery img.img-fluid").attr("src");
    const finalImage =
      imageUrl ??
      (galleryImg
        ? galleryImg.startsWith("http")
          ? galleryImg
          : `${FIM_BASE_URL}${galleryImg}`
        : null);

    return {
      ...article,
      publishedAt: publishedAt ?? article.publishedAt,
      contentHtml: contentHtml ?? article.contentHtml,
      contentText: contentText ?? article.contentText,
      imageUrl: finalImage,
    };
  }

  private mapSport(breadcrumb: string): string {
    const lower = breadcrumb.toLowerCase();

    if (lower.includes("enduro")) return "enduro";
    if (
      lower.includes("motocross") ||
      lower.includes("mxgp") ||
      lower.includes("mx2")
    )
      return "motocross";
    if (lower.includes("trial")) return "trial";
    if (lower.includes("supermoto")) return "supermoto";

    return this.defaultSport;
  }

  private parseDate(dateStr: string | null): string | null {
    if (!dateStr) return null;

    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [month, day, year] = parts;
      const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      const date = new Date(iso);
      if (!isNaN(date.getTime())) return date.toISOString();
    }

    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date.toISOString();

    return null;
  }

  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GnarlyGridNews/1.0 (motorsport news aggregator)",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url}`);
    }

    return response.text();
  }
}
