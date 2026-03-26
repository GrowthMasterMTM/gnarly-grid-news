import type { Parser, ParseResult, ParsedArticle } from "./types";
import { htmlToPlainText, decodeHtmlEntities } from "@/lib/html";
import { selectWpImageUrl } from "@/lib/wp-media";

const API_BASE = "https://superenduro.org/wp-json/wp/v2/posts";

interface WpPost {
  id: number;
  date: string;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: Record<string, unknown>;
}

export class SuperEnduroParser implements Parser {
  readonly key = "superenduro";

  async parse(): Promise<ParseResult> {
    const errors: string[] = [];
    const articles: ParsedArticle[] = [];

    try {
      const url = `${API_BASE}?per_page=100&page=1&_embed`;
      const posts = await this.fetchJson<WpPost[]>(url);

      if (!Array.isArray(posts)) {
        return { articles: [], errors: ["Invalid API response"] };
      }

      for (const post of posts) {
        try {
          const article = this.transformPost(post);
          if (article) articles.push(article);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Transform error";
          errors.push(`[${post.slug}]: ${message}`);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch posts";
      errors.push(message);
    }

    return { articles, errors };
  }

  private transformPost(post: WpPost): ParsedArticle | null {
    const title = decodeHtmlEntities(post.title.rendered).trim();
    if (!title) return null;

    const url = post.link.replace(/\/+$/, "");
    const contentHtml = post.content.rendered || null;
    const contentText = contentHtml ? htmlToPlainText(contentHtml) : null;
    const imageUrl = selectWpImageUrl(post._embedded as Record<string, unknown[]>);

    return {
      title,
      url,
      publishedAt: post.date || null,
      contentHtml,
      contentText,
      imageUrl,
      sport: "enduro",
      category: "news",
    };
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GnarlyGridNews/1.0 (motorsport news aggregator)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url}`);
    }

    return response.json() as Promise<T>;
  }
}
