import { NextResponse } from "next/server";
import { generateDailyPosts } from "@/server/social/content-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await generateDailyPosts(3);
  return NextResponse.json({ posts, count: posts.length });
}
