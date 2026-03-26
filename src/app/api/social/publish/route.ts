import { NextResponse } from "next/server";
import { generateDailyPosts } from "@/server/social/content-generator";
import { publishMultiple, isFacebookConfigured } from "@/server/social/facebook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function handler() {
  if (!isFacebookConfigured()) {
    return NextResponse.json(
      { error: "Facebook not configured. Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_TOKEN." },
      { status: 400 }
    );
  }

  const posts = await generateDailyPosts(2);
  if (posts.length === 0) {
    return NextResponse.json({ message: "No posts to publish", results: [] });
  }

  const results = await publishMultiple(posts);
  return NextResponse.json({
    published: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  });
}

export { handler as GET, handler as POST };
