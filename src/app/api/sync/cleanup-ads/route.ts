import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AD_KEYWORDS, AD_URL_PATTERNS } from "@/server/sync/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Finds and unpublishes existing articles that match the advertising filter.
 * GET  → dry run (preview what would be removed)
 * POST → unpublish matching articles
 */
async function handler(request: Request) {
  const isDryRun = request.method === "GET";

  try {
    // Build OR conditions for title matches
    const titleConditions = AD_KEYWORDS.map((kw) => ({
      title: { contains: kw, mode: "insensitive" as const },
    }));

    // Build OR conditions for URL matches
    const urlConditions = AD_URL_PATTERNS.map((pattern) => ({
      url: { contains: pattern, mode: "insensitive" as const },
    }));

    // Also match articles with no content (empty stubs from ad pages)
    const emptyContentCondition = {
      AND: [
        { contentText: null },
        { contentHtml: null },
      ],
    };

    const matchingArticles = await prisma.article.findMany({
      where: {
        isPublished: true,
        OR: [...titleConditions, ...urlConditions],
      },
      select: {
        id: true,
        title: true,
        url: true,
        publishedAt: true,
        source: { select: { slug: true } },
      },
      orderBy: { publishedAt: "desc" },
    });

    if (isDryRun) {
      return NextResponse.json({
        mode: "dry_run",
        matchCount: matchingArticles.length,
        articles: matchingArticles.map((a) => ({
          id: a.id,
          title: a.title,
          url: a.url,
          source: a.source.slug,
        })),
      });
    }

    // Unpublish (soft-delete) instead of hard-delete
    const ids = matchingArticles.map((a) => a.id);
    if (ids.length > 0) {
      await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { isPublished: false },
      });
    }

    return NextResponse.json({
      mode: "executed",
      unpublished: ids.length,
      articles: matchingArticles.map((a) => ({
        id: a.id,
        title: a.title,
        source: a.source.slug,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cleanup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export { handler as GET, handler as POST };
