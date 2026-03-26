/**
 * Deterministic summary generation for story groups.
 * Always available as fallback when AI is not configured or fails.
 */

import type { ArticleForSummary } from "./summary-service";

export interface GroupSummaryResult {
  headline: string;
  summary: string;
}

export function generateDeterministicSummary(
  articles: ArticleForSummary[]
): GroupSummaryResult {
  if (articles.length === 0) {
    return { headline: "Untitled Story", summary: "" };
  }

  const primary = selectPrimaryArticle(articles);
  const headline = buildHeadline(primary, articles);
  const summary = buildSummary(primary, articles);

  return { headline, summary };
}

function selectPrimaryArticle(
  articles: ArticleForSummary[]
): ArticleForSummary {
  const official = articles.filter((a) => a.source.isOfficial);
  const candidates = official.length > 0 ? official : articles;

  return candidates.reduce((best, current) => {
    const bestLen = best.summary?.length ?? 0;
    const currentLen = current.summary?.length ?? 0;
    return currentLen > bestLen ? current : best;
  }, candidates[0]);
}

function buildHeadline(
  primary: ArticleForSummary,
  articles: ArticleForSummary[]
): string {
  // Use primary title, but clean up common noise
  let headline = primary.title.trim();

  // Remove trailing source names if they appear in the title
  for (const a of articles) {
    const suffix = ` - ${a.source.name}`;
    if (headline.endsWith(suffix)) {
      headline = headline.slice(0, -suffix.length).trim();
    }
  }

  return headline;
}

function buildSummary(
  primary: ArticleForSummary,
  articles: ArticleForSummary[]
): string {
  const sourceNames = [...new Set(articles.map((a) => a.source.name))];
  const parts: string[] = [];

  // Use primary article's summary as base
  const baseSummary = primary.summary?.trim();
  if (baseSummary) {
    parts.push(baseSummary);
  } else if (primary.contentText) {
    // Extract first meaningful sentence from content
    const firstSentence = extractFirstSentence(primary.contentText);
    if (firstSentence) parts.push(firstSentence);
  }

  // Add source coverage context
  if (sourceNames.length > 1) {
    const officialCount = articles.filter(
      (a) => a.source.isOfficial
    ).length;
    if (officialCount > 0 && officialCount < sourceNames.length) {
      parts.push(
        `Reported by ${sourceNames.length} sources including ${officialCount} official.`
      );
    } else {
      parts.push(`Covered by ${sourceNames.join(" and ")}.`);
    }
  }

  return parts.join(" ");
}

function extractFirstSentence(text: string): string | null {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;

  // Find first sentence ending
  const match = clean.match(/^(.{20,200}?[.!?])\s/);
  if (match) return match[1];

  // Fallback: truncate at 150 chars
  if (clean.length > 150) {
    const truncated = clean.slice(0, 150);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
  }

  return clean;
}
