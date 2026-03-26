/**
 * Lightweight HTML digest formatter.
 * Email/newsletter-friendly structure with inline styles.
 * Not app rendering — export-oriented HTML.
 */

import type { ExportDigest } from "./digest-export";

export function formatDigestAsHtml(digest: ExportDigest): string {
  const sections = digest.sections.map(renderSection).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(digest.title)} — ${escapeHtml(digest.siteName)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:24px;margin:0;">${escapeHtml(digest.siteName)}</h1>
      <p style="color:#a3a3a3;font-size:14px;margin:8px 0 0;">${escapeHtml(digest.title)} — ${escapeHtml(digest.dateLabel)}</p>
    </div>
${sections}
    <div style="border-top:1px solid #262626;margin-top:32px;padding-top:16px;text-align:center;">
      <p style="color:#737373;font-size:12px;margin:0;">
        <a href="${escapeHtml(digest.siteUrl)}" style="color:#a3a3a3;text-decoration:none;">${escapeHtml(digest.siteName)}</a>
        — Aggregated motorsport news
      </p>
    </div>
  </div>
</body>
</html>`;
}

function renderSection(section: {
  title: string;
  href: string;
  signals?: Array<{
    headline: string;
    summary: string;
    sourceCount: number;
    primaryArticleUrl: string | null;
  }>;
  articles?: Array<{
    title: string;
    url: string;
    summary: string | null;
    sourceName: string;
    isOfficial: boolean;
  }>;
  events?: Array<{
    title: string;
    url: string;
    championship: string;
    location: string | null;
    startDate: string;
  }>;
}): string {
  const items: string[] = [];

  if (section.signals) {
    for (const s of section.signals) {
      items.push(`
      <div style="margin-bottom:16px;">
        <a href="${escapeHtml(s.primaryArticleUrl ?? section.href)}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${escapeHtml(s.headline)}</a>
        <p style="color:#a3a3a3;font-size:13px;margin:4px 0 0;line-height:1.4;">${escapeHtml(s.summary)}</p>
        <p style="color:#525252;font-size:11px;margin:4px 0 0;">${s.sourceCount} sources</p>
      </div>`);
    }
  }

  if (section.articles) {
    for (const a of section.articles) {
      items.push(`
      <div style="margin-bottom:16px;">
        <a href="${escapeHtml(a.url)}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${escapeHtml(a.title)}</a>
        ${a.summary ? `<p style="color:#a3a3a3;font-size:13px;margin:4px 0 0;line-height:1.4;">${escapeHtml(a.summary)}</p>` : ""}
        <p style="color:#525252;font-size:11px;margin:4px 0 0;">${escapeHtml(a.sourceName)}${a.isOfficial ? " (official)" : ""}</p>
      </div>`);
    }
  }

  if (section.events) {
    for (const e of section.events) {
      const date = e.startDate.slice(0, 10);
      items.push(`
      <div style="margin-bottom:16px;">
        <a href="${escapeHtml(e.url)}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${escapeHtml(e.title)}</a>
        <p style="color:#a3a3a3;font-size:13px;margin:4px 0 0;">${date} — ${escapeHtml(e.championship)}${e.location ? ` — ${escapeHtml(e.location)}` : ""}</p>
      </div>`);
    }
  }

  return `
    <div style="margin-bottom:28px;">
      <h2 style="color:#ffffff;font-size:18px;margin:0 0 12px;border-bottom:1px solid #262626;padding-bottom:8px;">
        <a href="${escapeHtml(section.href)}" style="color:#ffffff;text-decoration:none;">${escapeHtml(section.title)}</a>
      </h2>
${items.join("\n")}
    </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
