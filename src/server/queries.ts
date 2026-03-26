import { prisma, safeQuery } from "@/lib/db";
import type { ArticleFilters } from "@/types/filters";
import type { Prisma } from "@prisma/client";

const EMPTY_ARTICLES = { articles: [] as never[], total: 0, page: 1, totalPages: 0 };

const SOURCE_SELECT = {
  name: true,
  slug: true,
  logoUrl: true,
  isOfficial: true,
} as const;

function buildWhere(filters: ArticleFilters): Prisma.ArticleWhereInput {
  return {
    isPublished: true,
    isDuplicate: false,
    ...(filters.sport && { sport: filters.sport }),
    ...(filters.region && { region: filters.region }),
    ...(filters.category && { category: filters.category }),
    ...(filters.sourceSlug && { source: { slug: filters.sourceSlug } }),
    ...(filters.officialOnly && { source: { isOfficial: true } }),
    ...(filters.search && {
      title: { contains: filters.search, mode: "insensitive" as const },
    }),
  };
}

export async function getArticles(filters: ArticleFilters) {
  const result = await safeQuery(async () => {
    const where = buildWhere(filters);

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: { source: { select: SOURCE_SELECT } },
        orderBy: { publishedAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.article.count({ where }),
    ]);

    return {
      articles,
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit),
    };
  });

  return result ?? EMPTY_ARTICLES;
}

export interface ArticleWithGroupCount {
  id: string;
  title: string;
  slug: string;
  url: string;
  contentHash: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  sport: string;
  region: string;
  category: string;
  duplicateGroupKey: string | null;
  sourceId: string;
  source: {
    name: string;
    slug: string;
    logoUrl: string | null;
    isOfficial: boolean;
  };
  groupSourceCount: number;
}

export async function getArticlesWithGroupCounts(filters: ArticleFilters) {
  const result = await safeQuery(async () => {
    const where = buildWhere(filters);

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: { source: { select: SOURCE_SELECT } },
        orderBy: { publishedAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.article.count({ where }),
    ]);

    // Batch-fetch group counts for articles that have a groupKey
    const groupKeys = articles
      .map((a) => a.duplicateGroupKey)
      .filter((k): k is string => k !== null);

    const uniqueKeys = [...new Set(groupKeys)];
    let groupCounts: Record<string, number> = {};

    if (uniqueKeys.length > 0) {
      const counts = await prisma.article.groupBy({
        by: ["duplicateGroupKey"],
        where: {
          duplicateGroupKey: { in: uniqueKeys },
          isPublished: true,
        },
        _count: true,
      });

      groupCounts = Object.fromEntries(
        counts
          .filter((c) => c.duplicateGroupKey !== null)
          .map((c) => [c.duplicateGroupKey!, c._count])
      );
    }

    const articlesWithCounts: ArticleWithGroupCount[] = articles.map((a) => ({
      ...a,
      groupSourceCount: a.duplicateGroupKey
        ? (groupCounts[a.duplicateGroupKey] ?? 1)
        : 1,
    }));

    return {
      articles: articlesWithCounts,
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit),
    };
  });

  return result ?? { articles: [] as ArticleWithGroupCount[], total: 0, page: 1, totalPages: 0 };
}

export async function getArticleBySlug(slug: string) {
  return safeQuery(() =>
    prisma.article.findUnique({
      where: { slug },
      include: {
        source: { select: SOURCE_SELECT },
        articleTags: { include: { tag: true } },
      },
    })
  );
}

export async function getArticleGroup(groupKey: string, excludeId?: string) {
  const result = await safeQuery(() =>
    prisma.article.findMany({
      where: {
        duplicateGroupKey: groupKey,
        isPublished: true,
        ...(excludeId && { id: { not: excludeId } }),
      },
      include: { source: { select: SOURCE_SELECT } },
      orderBy: [
        { source: { isOfficial: "desc" } },
        { publishedAt: "desc" },
      ],
      take: 10,
    })
  );
  return result ?? [];
}

const ARTICLE_WITH_SOURCE_INCLUDE = {
  source: { select: SOURCE_SELECT },
} as const;

type ArticleWithSource = Prisma.ArticleGetPayload<{
  include: typeof ARTICLE_WITH_SOURCE_INCLUDE;
}>;

export async function getRelatedArticles(
  articleId: string,
  sport: string,
  sourceId: string,
  groupKey: string | null,
  limit: number = 5
): Promise<ArticleWithSource[]> {
  const result = await safeQuery(async () => {
    const excludeIds = [articleId];
    const results: ArticleWithSource[] = [];

    // Priority 1: same group (different perspectives on same story)
    if (groupKey) {
      const grouped = await prisma.article.findMany({
        where: {
          isPublished: true,
          duplicateGroupKey: groupKey,
          id: { notIn: excludeIds },
        },
        include: ARTICLE_WITH_SOURCE_INCLUDE,
        orderBy: [{ source: { isOfficial: "desc" } }, { publishedAt: "desc" }],
        take: 2,
      });
      results.push(...grouped);
      excludeIds.push(...grouped.map((a) => a.id));
    }

    if (results.length >= limit) return results.slice(0, limit);

    // Priority 2: same source
    const sameSource = await prisma.article.findMany({
      where: {
        isPublished: true,
        isDuplicate: false,
        id: { notIn: excludeIds },
        sourceId,
      },
      include: ARTICLE_WITH_SOURCE_INCLUDE,
      orderBy: { publishedAt: "desc" },
      take: limit - results.length,
    });
    results.push(...sameSource);
    excludeIds.push(...sameSource.map((a) => a.id));

    if (results.length >= limit) return results.slice(0, limit);

    // Priority 3: same sport
    const sameSport = await prisma.article.findMany({
      where: {
        isPublished: true,
        isDuplicate: false,
        id: { notIn: excludeIds },
        sport,
      },
      include: ARTICLE_WITH_SOURCE_INCLUDE,
      orderBy: { publishedAt: "desc" },
      take: limit - results.length,
    });
    results.push(...sameSport);

    return results.slice(0, limit);
  });

  return result ?? [];
}

export async function getLatestSignals(limit: number = 6) {
  const result = await safeQuery(async () => {
    // Get latest articles that have group keys (multi-source stories)
    const grouped = await prisma.article.findMany({
      where: {
        isPublished: true,
        isDuplicate: false,
        duplicateGroupKey: { not: null },
      },
      include: { source: { select: SOURCE_SELECT } },
      orderBy: { publishedAt: "desc" },
      take: limit * 3,
    });

    // Dedupe by groupKey — keep the primary (official first, then newest)
    const seen = new Set<string>();
    const signals: typeof grouped = [];

    for (const article of grouped) {
      const key = article.duplicateGroupKey!;
      if (seen.has(key)) continue;
      seen.add(key);
      signals.push(article);
      if (signals.length >= limit) break;
    }

    // Get group counts
    const groupKeys = signals.map((a) => a.duplicateGroupKey!);
    const counts = await prisma.article.groupBy({
      by: ["duplicateGroupKey"],
      where: {
        duplicateGroupKey: { in: groupKeys },
        isPublished: true,
      },
      _count: true,
    });

    const countMap = Object.fromEntries(
      counts
        .filter((c) => c.duplicateGroupKey !== null)
        .map((c) => [c.duplicateGroupKey!, c._count])
    );

    return signals.map((a) => ({
      ...a,
      groupSourceCount: countMap[a.duplicateGroupKey!] ?? 1,
    }));
  });

  return result ?? [];
}

export interface StoryGroupWithArticle {
  id: string;
  groupKey: string;
  headline: string;
  summary: string;
  sport: string | null;
  sourceCount: number;
  latestPublishedAt: Date | null;
  primaryArticle: ArticleWithSource | null;
}

export async function getStoryGroups(options: {
  sport?: string;
  limit?: number;
  page?: number;
}): Promise<{ groups: StoryGroupWithArticle[]; total: number }> {
  const { sport, limit = 10, page = 1 } = options;

  const result = await safeQuery(async () => {
    const where = {
      sourceCount: { gte: 2 },
      ...(sport && { sport }),
    };

    const [storyGroups, total] = await Promise.all([
      prisma.storyGroup.findMany({
        where,
        orderBy: { latestPublishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.storyGroup.count({ where }),
    ]);

    // Fetch primary articles for each group
    const primaryIds = storyGroups
      .map((g) => g.primaryArticleId)
      .filter((id): id is string => id !== null);

    const primaryArticles =
      primaryIds.length > 0
        ? await prisma.article.findMany({
            where: { id: { in: primaryIds } },
            include: ARTICLE_WITH_SOURCE_INCLUDE,
          })
        : [];

    const articleMap = new Map(primaryArticles.map((a) => [a.id, a]));

    const groups: StoryGroupWithArticle[] = storyGroups.map((g) => ({
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

    return { groups, total };
  });

  return result ?? { groups: [], total: 0 };
}

export async function getLatestArticles(limit: number = 10) {
  const result = await safeQuery(() =>
    prisma.article.findMany({
      where: { isPublished: true, isDuplicate: false },
      include: { source: { select: SOURCE_SELECT } },
      orderBy: { publishedAt: "desc" },
      take: limit,
    })
  );
  return result ?? [];
}

export async function getSources() {
  const result = await safeQuery(() =>
    prisma.source.findMany({
      where: { isActive: true },
      include: { _count: { select: { articles: true } } },
      orderBy: { name: "asc" },
    })
  );
  return result ?? [];
}

export async function getSourceBySlug(slug: string) {
  return safeQuery(() =>
    prisma.source.findUnique({
      where: { slug },
      include: { _count: { select: { articles: true, syncRuns: true } } },
    })
  );
}

export async function getAdminStats() {
  const result = await safeQuery(async () => {
    const [sourceCount, articleCount, lastSync] = await Promise.all([
      prisma.source.count({ where: { isActive: true } }),
      prisma.article.count({ where: { isDuplicate: false } }),
      prisma.syncRun.findFirst({ orderBy: { startedAt: "desc" } }),
    ]);
    return { sourceCount, articleCount, lastSync };
  });
  return result ?? { sourceCount: 0, articleCount: 0, lastSync: null };
}

export async function getSyncRuns(limit: number = 50) {
  const result = await safeQuery(() =>
    prisma.syncRun.findMany({
      include: { source: { select: { name: true, slug: true } } },
      orderBy: { startedAt: "desc" },
      take: limit,
    })
  );
  return result ?? [];
}
