/**
 * Summary service — the single entry point for StoryGroup summary generation.
 *
 * Supports two modes:
 * 1. AI summarization (when AI_API_KEY is configured)
 * 2. Deterministic fallback (always available)
 *
 * AI failures always fall back to deterministic mode without crashing.
 */

import { generateDeterministicSummary } from "./summarize";
import { generateAiSummary, isAiConfigured } from "./ai-provider";
import { shortHash } from "@/lib/hash";

export interface ArticleForSummary {
  title: string;
  summary: string | null;
  contentText: string | null;
  publishedAt: Date | null;
  sport: string;
  source: { name: string; isOfficial: boolean };
}

export interface SummaryResult {
  headline: string;
  summary: string;
  provider: "ai" | "deterministic";
  inputHash: string;
}

export async function generateGroupSummary(
  articles: ArticleForSummary[]
): Promise<SummaryResult> {
  const inputHash = computeInputHash(articles);

  // Try AI first if configured
  if (isAiConfigured()) {
    try {
      const result = await generateAiSummary(articles);
      if (result && result.headline && result.summary) {
        return {
          headline: result.headline,
          summary: result.summary,
          provider: "ai",
          inputHash,
        };
      }
    } catch (err) {
      console.error(
        "[SummaryService] AI failed, using fallback:",
        err instanceof Error ? err.message : "unknown error"
      );
    }
  }

  // Deterministic fallback
  const fallback = generateDeterministicSummary(articles);
  return {
    ...fallback,
    provider: "deterministic",
    inputHash,
  };
}

export function getSummaryProviderStatus(): {
  provider: string;
  configured: boolean;
} {
  if (isAiConfigured()) {
    return {
      provider: process.env.AI_SUMMARY_PROVIDER ?? "anthropic",
      configured: true,
    };
  }
  return { provider: "deterministic", configured: false };
}

function computeInputHash(articles: ArticleForSummary[]): string {
  const key = articles
    .map((a) => `${a.title}|${a.source.name}`)
    .sort()
    .join(";");
  return shortHash(key, 16);
}
