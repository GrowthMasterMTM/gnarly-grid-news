/**
 * Plain text digest formatter.
 * Suitable for email body, copy/paste briefing, or simple export.
 */

import type { ExportDigest } from "./digest-export";

export function formatDigestAsPlainText(digest: ExportDigest): string {
  const lines: string[] = [];

  lines.push(digest.title.toUpperCase());
  lines.push(digest.dateLabel);
  lines.push(`Generated: ${digest.generatedAt.slice(0, 10)}`);
  lines.push("");
  lines.push("=".repeat(50));

  for (const section of digest.sections) {
    lines.push("");
    lines.push(`--- ${section.title} ---`);
    lines.push("");

    if (section.signals) {
      for (const signal of section.signals) {
        lines.push(`* ${signal.headline}`);
        if (signal.summary) lines.push(`  ${signal.summary}`);
        lines.push(`  [${signal.sourceCount} sources] ${signal.primaryArticleUrl ?? ""}`);
        lines.push("");
      }
    }

    if (section.articles) {
      for (const article of section.articles) {
        lines.push(`* ${article.title}`);
        if (article.summary) lines.push(`  ${article.summary}`);
        lines.push(`  ${article.sourceName}${article.isOfficial ? " (official)" : ""} | ${article.url}`);
        lines.push("");
      }
    }

    if (section.events) {
      for (const event of section.events) {
        const date = event.startDate.slice(0, 10);
        lines.push(`* ${event.title}`);
        lines.push(`  ${date} | ${event.championship} | ${event.location ?? "TBD"}`);
        lines.push(`  ${event.url}`);
        lines.push("");
      }
    }
  }

  lines.push("=".repeat(50));
  lines.push(`${digest.siteName} — ${digest.siteUrl}`);

  return lines.join("\n");
}
