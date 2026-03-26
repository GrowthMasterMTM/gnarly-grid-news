import { NextResponse } from "next/server";
import { generateLaunchPosts } from "@/server/social/content-generator";
import { publishMultiple, isFacebookConfigured } from "@/server/social/facebook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  // Preview mode — just show the posts
  const posts = await generateLaunchPosts();
  return NextResponse.json({ posts, count: posts.length });
}

export async function POST() {
  if (!isFacebookConfigured()) {
    return NextResponse.json(
      { error: "Facebook not configured. Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_TOKEN." },
      { status: 400 }
    );
  }

  const posts = await generateLaunchPosts();
  const results = await publishMultiple(posts, 10000); // 10s delay between posts

  return NextResponse.json({
    published: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  });
}
