/**
 * Digest export service — transforms digest data into clean serializable objects.
 * Reusable for JSON API, email, PDF, and page rendering.
 *
 * Future integration points:
 * - Email: pass ExportDigest to an email template renderer + sending service
 * - PDF: pass ExportDigest to a PDF generation library
 * - API: return ExportDigest directly as JSON response
 */

import { siteConfig } from "@/config/site";
import type { DigestData } from "@/server/digest";

export interface ExportArticle {
  title: string;
  slug: string;
  url: string;
  summary: string | null;
  sourceName: string;
  isOfficial: boolean;
  sport: string;
  publishedAt: string | null;
}

export interface ExportSignal {
  headline: string;
  summary: string;
  sourceCount: number;
  sport: string | null;
  publishedAt: string | null;
  primaryArticleSlug: string | null;
  primaryArticleUrl: string | null;
}

export interface ExportDigest {
  title: string;
  dateLabel: string;
  generatedAt: string;
  siteUrl: string;
  siteName: string;
  sections: ExportSection[];
}

export interface ExportEvent {
  title: string;
  slug: string;
  url: string;
  championship: string;
  discipline: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
}

export interface ExportSection {
  title: string;
  href: string;
  signals?: ExportSignal[];
  articles?: ExportArticle[];
  events?: ExportEvent[];
}

export function exportDigest(
  digest: DigestData,
  title: string
): ExportDigest {
  const sections: ExportSection[] = [];

  if (digest.topSignals.length > 0) {
    sections.push({
      title: "Top Signals",
      href: `${siteConfig.url}/signals`,
      signals: digest.topSignals.map(exportSignal),
    });
  }

  if (digest.officialUpdates.length > 0) {
    sections.push({
      title: "Official Updates",
      href: `${siteConfig.url}/official`,
      articles: digest.officialUpdates.map(exportArticle),
    });
  }

  if (digest.enduroHighlights.length > 0) {
    sections.push({
      title: "Enduro",
      href: `${siteConfig.url}/enduro`,
      articles: digest.enduroHighlights.map(exportArticle),
    });
  }

  if (digest.mxHighlights.length > 0) {
    sections.push({
      title: "Motocross",
      href: `${siteConfig.url}/mx`,
      articles: digest.mxHighlights.map(exportArticle),
    });
  }

  if (digest.swedenUpdates.length > 0) {
    sections.push({
      title: "Sweden",
      href: `${siteConfig.url}/news?region=sweden`,
      articles: digest.swedenUpdates.map(exportArticle),
    });
  }

  if (digest.upcomingEvents.length > 0) {
    sections.push({
      title: "Upcoming Events",
      href: `${siteConfig.url}/events`,
      events: digest.upcomingEvents.map((e) => ({
        title: e.title,
        slug: e.slug,
        url: `${siteConfig.url}/events/${e.slug}`,
        championship: e.championship,
        discipline: e.discipline,
        location: e.location,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate?.toISOString() ?? null,
      })),
    });
  }

  return {
    title,
    dateLabel: digest.dateLabel,
    generatedAt: new Date().toISOString(),
    siteUrl: siteConfig.url,
    siteName: siteConfig.name,
    sections,
  };
}

function exportArticle(article: {
  title: string;
  slug: string;
  summary: string | null;
  sport: string;
  publishedAt: Date | null;
  source: { name: string; isOfficial: boolean };
}): ExportArticle {
  return {
    title: article.title,
    slug: article.slug,
    url: `${siteConfig.url}/story/${article.slug}`,
    summary: article.summary,
    sourceName: article.source.name,
    isOfficial: article.source.isOfficial,
    sport: article.sport,
    publishedAt: article.publishedAt?.toISOString() ?? null,
  };
}

function exportSignal(signal: {
  headline: string;
  summary: string;
  sourceCount: number;
  sport: string | null;
  latestPublishedAt: Date | null;
  primaryArticle: { slug: string } | null;
}): ExportSignal {
  return {
    headline: signal.headline,
    summary: signal.summary,
    sourceCount: signal.sourceCount,
    sport: signal.sport,
    publishedAt: signal.latestPublishedAt?.toISOString() ?? null,
    primaryArticleSlug: signal.primaryArticle?.slug ?? null,
    primaryArticleUrl: signal.primaryArticle
      ? `${siteConfig.url}/story/${signal.primaryArticle.slug}`
      : null,
  };
}
