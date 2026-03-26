import type { ParsedArticle } from "@/server/parsers/types";
import { articleSlug } from "@/lib/slug";
import { contentHash } from "@/lib/hash";

export interface NormalizedArticle {
  title: string;
  slug: string;
  url: string;
  contentHash: string;
  contentHtml: string | null;
  contentText: string | null;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  sport: string;
  region: string;
  category: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateParsedArticle(
  parsed: ParsedArticle
): ValidationError | null {
  if (!parsed.title || !parsed.title.trim()) {
    return { field: "title", message: "Title is missing or empty" };
  }
  if (!parsed.url || !parsed.url.trim()) {
    return { field: "url", message: "URL is missing or empty" };
  }
  try {
    new URL(parsed.url);
  } catch {
    return { field: "url", message: `Invalid URL: ${parsed.url}` };
  }
  return null;
}

export function normalizeArticle(
  parsed: ParsedArticle,
  sourceSlug: string,
  sourceRegion: string
): NormalizedArticle {
  const title = cleanText(parsed.title);
  if (!title) {
    throw new Error("Article has no title");
  }

  const url = normalizeUrl(parsed.url);
  if (!url) {
    throw new Error("Article has no URL");
  }

  const publishedAt = parseDate(parsed.publishedAt);
  const slug = articleSlug(title, sourceSlug, publishedAt);
  const hash = contentHash(url + title);
  const summary = buildSummary(parsed.contentText);

  return {
    title,
    slug,
    url,
    contentHash: hash,
    contentHtml: parsed.contentHtml || null,
    contentText: parsed.contentText || null,
    summary,
    imageUrl: parsed.imageUrl || null,
    publishedAt,
    sport: parsed.sport || "general",
    region: sourceRegion,
    category: parsed.category || "news",
  };
}

function buildSummary(text: string | null): string | null {
  if (!text) return null;
  const clean = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const maxLength = 200;
  if (clean.length <= maxLength) return clean;
  const truncated = clean.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date;
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "").trim();
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
