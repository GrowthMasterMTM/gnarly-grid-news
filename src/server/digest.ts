import { prisma, safeQuery } from "@/lib/db";
import type { StoryGroupWithArticle } from "./queries";
import { getUpcomingEvents } from "./events";
import { getLatestInsights } from "./results/queries";

const SOURCE_SELECT = {
  name: true,
  slug: true,
  logoUrl: true,
  isOfficial: true,
} as const;

const ARTICLE_INCLUDE = { source: { select: SOURCE_SELECT } } as const;

type ArticleWithSource = Awaited<
  ReturnType<typeof prisma.article.findFirst<{ include: typeof ARTICLE_INCLUDE }>>
>;

export interface DigestEvent {
  title: string;
  slug: string;
  championship: string;
  discipline: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  status: string;
}

export interface DigestInsight {
  headline: string;
  summary: string;
  insightType: string;
  eventSlug: string | null;
  eventTitle: string | null;
}

export interface DigestData {
  topSignals: StoryGroupWithArticle[];
  officialUpdates: NonNullable<ArticleWithSource>[];
  enduroHighlights: NonNullable<ArticleWithSource>[];
  mxHighlights: NonNullable<ArticleWithSource>[];
  swedenUpdates: NonNullable<ArticleWithSource>[];
  upcomingEvents: DigestEvent[];
  latestInsights: DigestInsight[];
  dateLabel: string;
}

function dateRange(daysBack: number): { gte: Date } {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(0, 0, 0, 0);
  return { gte: d };
}

function formatDateLabel(daysBack: number): string {
  if (daysBack <= 1) return "Today";
  if (daysBack <= 7) return "This Week";
  return `Last ${daysBack} days`;
}

export async function getDailyDigest(): Promise<DigestData> {
  return getDigest(1, "Today's Briefing");
}

export async function getWeeklyDigest(): Promise<DigestData> {
  return getDigest(7, "This Week");
}

async function getDigest(
  daysBack: number,
  dateLabel: string
): Promise<DigestData> {
  const range = dateRange(daysBack);

  const [dbResult, events, rawInsights] = await Promise.all([
    safeQuery(async () => {
      const [signals, official, enduro, mx, sweden] = await Promise.all([
        getRecentSignals(range, 5),
        getRecentArticles({ publishedAt: range, source: { isOfficial: true } }, 5),
        getRecentArticles({ publishedAt: range, sport: "enduro" }, 5),
        getRecentArticles({ publishedAt: range, sport: "motocross" }, 5),
        getRecentArticles({ publishedAt: range, region: "sweden" }, 4),
      ]);
      return { topSignals: signals, officialUpdates: official, enduroHighlights: enduro, mxHighlights: mx, swedenUpdates: sweden };
    }),
    getUpcomingEvents(4),
    getLatestInsights({ sourceScope: "event", limit: 4 }),
  ]);

  const latestInsights: DigestInsight[] = rawInsights.map((i) => ({
    headline: i.headline,
    summary: i.summary,
    insightType: i.insightType,
    eventSlug: i.event?.slug ?? null,
    eventTitle: i.event?.title ?? null,
  }));

  return {
    topSignals: dbResult?.topSignals ?? [],
    officialUpdates: dbResult?.officialUpdates ?? [],
    enduroHighlights: dbResult?.enduroHighlights ?? [],
    mxHighlights: dbResult?.mxHighlights ?? [],
    swedenUpdates: dbResult?.swedenUpdates ?? [],
    upcomingEvents: events,
    latestInsights,
    dateLabel,
  };
}

export async function getExpandedDigest(): Promise<DigestData> {
  const [dbResult, events, rawInsights] = await Promise.all([
    safeQuery(async () => {
      const [signals, official, enduro, mx, sweden] = await Promise.all([
        getRecentSignals(dateRange(30), 6),
        getRecentArticles({ source: { isOfficial: true } }, 6),
        getRecentArticles({ sport: "enduro" }, 6),
        getRecentArticles({ sport: "motocross" }, 6),
        getRecentArticles({ region: "sweden" }, 4),
      ]);
      return { topSignals: signals, officialUpdates: official, enduroHighlights: enduro, mxHighlights: mx, swedenUpdates: sweden };
    }),
    getUpcomingEvents(4),
    getLatestInsights({ sourceScope: "event", limit: 4 }),
  ]);

  const latestInsights: DigestInsight[] = rawInsights.map((i) => ({
    headline: i.headline,
    summary: i.summary,
    insightType: i.insightType,
    eventSlug: i.event?.slug ?? null,
    eventTitle: i.event?.title ?? null,
  }));

  return {
    topSignals: dbResult?.topSignals ?? [],
    officialUpdates: dbResult?.officialUpdates ?? [],
    enduroHighlights: dbResult?.enduroHighlights ?? [],
    mxHighlights: dbResult?.mxHighlights ?? [],
    swedenUpdates: dbResult?.swedenUpdates ?? [],
    upcomingEvents: events,
    latestInsights,
    dateLabel: formatDateLabel(30),
  };
}

async function getRecentSignals(
  publishedRange: { gte: Date },
  limit: number
): Promise<StoryGroupWithArticle[]> {
  const storyGroups = await prisma.storyGroup.findMany({
    where: {
      sourceCount: { gte: 2 },
      latestPublishedAt: publishedRange,
    },
    orderBy: { latestPublishedAt: "desc" },
    take: limit,
  });

  const primaryIds = storyGroups
    .map((g) => g.primaryArticleId)
    .filter((id): id is string => id !== null);

  const articles =
    primaryIds.length > 0
      ? await prisma.article.findMany({
          where: { id: { in: primaryIds } },
          include: ARTICLE_INCLUDE,
        })
      : [];

  const articleMap = new Map(articles.map((a) => [a.id, a]));

  return storyGroups.map((g) => ({
    id: g.id,
    groupKey: g.groupKey,
    headline: g.headline,
    summary: g.summary,
    sport: g.sport,
    sourceCount: g.sourceCount,
    latestPublishedAt: g.latestPublishedAt,
    primaryArticle: g.primaryArticleId
      ? articleMap.get(g.primaryArticleId) ?? null
      : null,
  }));
}

async function getRecentArticles(
  extraWhere: Record<string, unknown>,
  limit: number
): Promise<NonNullable<ArticleWithSource>[]> {
  const results = await prisma.article.findMany({
    where: {
      isPublished: true,
      isDuplicate: false,
      ...extraWhere,
    },
    include: ARTICLE_INCLUDE,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return results;
}
