import type { Parser, ParseResult, ParsedArticle } from "./types";
import { htmlToPlainText, decodeHtmlEntities } from "@/lib/html";
import { selectWpImageUrl } from "@/lib/wp-media";

const API_BASE = "https://www.endurogp.com/wp-json/wp/v2/posts";
const POSTS_PER_PAGE = 100;
const PAGES_TO_FETCH = 2;

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

export class EnduroGpParser implements Parser {
  readonly key = "endurogp";

  async parse(): Promise<ParseResult> {
    const errors: string[] = [];
    const articles: ParsedArticle[] = [];
    const seenUrls = new Set<string>();

    for (let page = 1; page <= PAGES_TO_FETCH; page++) {
      try {
        const url = `${API_BASE}?per_page=${POSTS_PER_PAGE}&page=${page}&_embed`;
        const posts = await this.fetchJson<WpPost[]>(url);

        if (!Array.isArray(posts) || posts.length === 0) break;

        for (const post of posts) {
          try {
            const article = this.transformPost(post);
            if (article && !seenUrls.has(article.url)) {
              seenUrls.add(article.url);
              articles.push(article);
            }
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Transform error";
            errors.push(`[${post.slug}]: ${message}`);
          }
        }

        if (posts.length < POSTS_PER_PAGE) break;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : `Failed to fetch page ${page}`;
        errors.push(`[page ${page}]: ${message}`);
        break;
      }
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
