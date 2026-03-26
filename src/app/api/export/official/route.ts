import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { getArticles } from "@/server/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { articles, total } = await getArticles({
    officialOnly: true,
    page: 1,
    limit: 20,
  });

  const exported = articles.map((a) => ({
    title: a.title,
    slug: a.slug,
    url: `${siteConfig.url}/story/${a.slug}`,
    summary: a.summary,
    sourceName: a.source.name,
    sport: a.sport,
    publishedAt: a.publishedAt?.toISOString() ?? null,
  }));

  return NextResponse.json({
    title: "Official Updates",
    total,
    generatedAt: new Date().toISOString(),
    articles: exported,
  });
}
