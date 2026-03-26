import * as cheerio from "cheerio";
import type { Parser, ParseResult, ParsedArticle } from "./types";

const DEM_BASE_URL = "https://www.enduro-dm.de";
const DEM_NEWS_URL = "https://www.enduro-dm.de/de/alle-news";

export class DemParser implements Parser {
  readonly key = "dem";

  async parse(): Promise<ParseResult> {
    const errors: string[] = [];
    const articles: ParsedArticle[] = [];

    try {
      const html = await this.fetchPage(DEM_NEWS_URL);
      const listings = this.parseListingPage(html);
      articles.push(...listings);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch DEM news";
      return { articles: [], errors: [message] };
    }

    // Enrich with article detail content
    const enriched = await this.enrichArticles(articles, errors);
    return { articles: enriched, errors };
  }

  private parseListingPage(html: string): ParsedArticle[] {
    const $ = cheerio.load(html);
    const articles: ParsedArticle[] = [];

    $("a.news-article__link").each((_, el) => {
      const linkEl = $(el);
      const href = linkEl.attr("href");
      if (!href || !href.startsWith("/de/news/")) return;

      const title = linkEl.find("span[itemprop='headline']").text().trim();
      if (!title) return;

      const url = `${DEM_BASE_URL}${href}`;

      // Navigate up to the article container to find date and image
      const container = linkEl.closest("[itemscope]").length
        ? linkEl.closest("[itemscope]")
        : linkEl.closest(".news-article__col").parent();

      const dateEl = container.find("time[itemprop='datePublished']");
      const dateStr = dateEl.attr("datetime") ?? null;
      const publishedAt = dateStr ? new Date(dateStr).toISOString() : null;

      const thumbnailMeta = container.find(
        "meta[itemprop='thumbnailUrl']"
      );
      const thumbUrl = thumbnailMeta.attr("content");
      const imageUrl = thumbUrl
        ? thumbUrl.startsWith("http")
          ? thumbUrl
          : `${DEM_BASE_URL}${thumbUrl}`
        : null;

      const teaser = container
        .find("div[itemprop='description']")
        .text()
        .replace(/\s+/g, " ")
        .trim();

      articles.push({
        title,
        url,
        publishedAt,
        contentHtml: null,
        contentText: teaser || null,
        imageUrl,
        sport: "enduro",
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

    const bodyEl = $("[itemprop='articleBody']");
    const contentHtml = bodyEl.html()?.trim() || null;
    const contentText = bodyEl.text().replace(/\s+/g, " ").trim() || null;

    // Better date from detail page
    const dateEl = $("time[itemprop='datePublished']").first();
    const dateStr = dateEl.attr("datetime");
    const publishedAt =
      dateStr && !isNaN(new Date(dateStr).getTime())
        ? new Date(dateStr).toISOString()
        : article.publishedAt;

    // Better image from detail page
    const ogImage = $("meta[property='og:image']").attr("content");
    const imageUrl =
      article.imageUrl ??
      (ogImage
        ? ogImage.startsWith("http")
          ? ogImage
          : `${DEM_BASE_URL}${ogImage}`
        : null);

    return {
      ...article,
      publishedAt: publishedAt ?? article.publishedAt,
      contentHtml: contentHtml ?? article.contentHtml,
      contentText: contentText ?? article.contentText,
      imageUrl,
    };
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
