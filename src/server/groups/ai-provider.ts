/**
 * AI summary provider — isolated behind the summary service boundary.
 *
 * Currently supports: Anthropic Claude API
 * Gracefully returns null if not configured or on failure.
 *
 * Required env vars for AI mode:
 * - AI_API_KEY
 * - AI_SUMMARY_PROVIDER (optional, defaults to "anthropic")
 * - AI_MODEL (optional, defaults to "claude-haiku-4-5-20251001")
 */

import type { ArticleForSummary } from "./summary-service";
import { fetchWithTimeout } from "@/lib/timeout";

const AI_TIMEOUT_MS = 15_000;

interface AiSummaryResult {
  headline: string;
  summary: string;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export async function generateAiSummary(
  articles: ArticleForSummary[]
): Promise<AiSummaryResult | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.AI_MODEL ?? "claude-haiku-4-5-20251001";
  const prompt = buildPrompt(articles);

  try {
    const response = await fetchWithTimeout(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      },
      AI_TIMEOUT_MS
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`AI API ${response.status}: ${text.slice(0, 100)}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ text?: string }>;
    };

    const text = data.content?.[0]?.text;
    if (!text) return null;

    return parseAiResponse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    console.error("[AI Provider]", message);
    return null;
  }
}

function buildPrompt(articles: ArticleForSummary[]): string {
  const articleLines = articles
    .slice(0, 6)
    .map((a) => {
      const date = a.publishedAt
        ? a.publishedAt.toISOString().slice(0, 10)
        : "unknown date";
      const excerpt = a.summary ?? a.contentText?.slice(0, 200) ?? "";
      return `- [${a.source.name}${a.source.isOfficial ? " (official)" : ""}] "${a.title}" (${date})\n  ${excerpt}`;
    })
    .join("\n");

  return `You are a motorsport news editor. Below are articles from different sources covering the same story.

Write:
1. A concise headline (max 15 words, factual, no clickbait)
2. A summary (2-3 sentences, factual, editorial tone)

Do NOT invent facts. Use only what's in the articles. Mention sources only if it adds value.

Articles:
${articleLines}

Respond in exactly this format:
HEADLINE: <your headline>
SUMMARY: <your summary>`;
}

function parseAiResponse(text: string): AiSummaryResult | null {
  const headlineMatch = text.match(/HEADLINE:\s*(.+?)(?:\n|$)/);
  const summaryMatch = text.match(/SUMMARY:\s*([\s\S]+)/);

  if (!headlineMatch || !summaryMatch) return null;

  const headline = headlineMatch[1].trim();
  const summary = summaryMatch[1].trim().replace(/\n+/g, " ");

  if (!headline || !summary) return null;

  return { headline, summary };
}

