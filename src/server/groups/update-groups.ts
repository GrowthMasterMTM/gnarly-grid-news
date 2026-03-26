import { prisma } from "@/lib/db";
import { generateGroupSummary } from "./summary-service";
import type { ArticleForSummary } from "./summary-service";

export interface UpdateGroupsResult {
  created: number;
  updated: number;
  skipped: number;
}

/**
 * Update or create StoryGroup records for all active groups.
 * Called after sync to keep group summaries fresh.
 * Skips regeneration if inputs haven't changed (based on inputHash).
 */
export async function updateStoryGroups(): Promise<UpdateGroupsResult> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const groups = await prisma.article.groupBy({
    by: ["duplicateGroupKey"],
    where: {
      duplicateGroupKey: { not: null },
      isPublished: true,
    },
    _count: true,
    having: {
      duplicateGroupKey: { _count: { gt: 1 } },
    },
  });

  for (const group of groups) {
    const groupKey = group.duplicateGroupKey;
    if (!groupKey) continue;

    const articles = await prisma.article.findMany({
      where: {
        duplicateGroupKey: groupKey,
        isPublished: true,
      },
      include: {
        source: { select: { name: true, isOfficial: true } },
      },
      orderBy: [
        { source: { isOfficial: "desc" } },
        { publishedAt: "desc" },
      ],
    });

    if (articles.length < 2) continue;

    const primary = articles[0];
    const latestPublishedAt =
      articles
        .map((a) => a.publishedAt)
        .filter((d): d is Date => d !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    // Map to summary input type
    const summaryInput: ArticleForSummary[] = articles.map((a) => ({
      title: a.title,
      summary: a.summary,
      contentText: a.contentText,
      publishedAt: a.publishedAt,
      sport: a.sport,
      source: a.source,
    }));

    // Check if we can skip regeneration
    const existing = await prisma.storyGroup.findUnique({
      where: { groupKey },
    });

    // Generate summary (AI or fallback)
    const result = await generateGroupSummary(summaryInput);

    // Skip if nothing changed
    if (
      existing &&
      existing.summaryHash === result.inputHash &&
      existing.sourceCount === articles.length &&
      existing.primaryArticleId === primary.id
    ) {
      skipped++;
      continue;
    }

    const data = {
      headline: result.headline,
      summary: result.summary,
      sourceCount: articles.length,
      primaryArticleId: primary.id,
      latestPublishedAt,
      sport: primary.sport,
      region: primary.region,
      summaryProvider: result.provider,
      summaryHash: result.inputHash,
    };

    if (existing) {
      await prisma.storyGroup.update({
        where: { groupKey },
        data,
      });
      updated++;
    } else {
      await prisma.storyGroup.create({
        data: { groupKey, ...data },
      });
      created++;
    }
  }

  return { created, updated, skipped };
}
