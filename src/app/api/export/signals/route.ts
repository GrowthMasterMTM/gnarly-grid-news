import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { getStoryGroups } from "@/server/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { groups, total } = await getStoryGroups({ limit: 20 });

  const signals = groups.map((g) => ({
    headline: g.headline,
    summary: g.summary,
    sourceCount: g.sourceCount,
    sport: g.sport,
    publishedAt: g.latestPublishedAt?.toISOString() ?? null,
    primaryArticleSlug: g.primaryArticle?.slug ?? null,
    primaryArticleUrl: g.primaryArticle
      ? `${siteConfig.url}/story/${g.primaryArticle.slug}`
      : null,
  }));

  return NextResponse.json({
    title: "Signals",
    total,
    generatedAt: new Date().toISOString(),
    signals,
  });
}
