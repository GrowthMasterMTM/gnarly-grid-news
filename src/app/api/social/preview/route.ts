import { NextResponse } from "next/server";
import { previewAllSlots } from "@/server/social/content-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const slots = await previewAllSlots();
  const total =
    slots.eu_morning.length + slots.us_morning.length;

  return NextResponse.json({ slots, totalPosts: total });
}
