import { NextRequest, NextResponse } from "next/server";
import { generateSlotPosts } from "@/server/social/content-generator";
import { publishMultiple, isFacebookConfigured } from "@/server/social/facebook";
import { shouldPostNow } from "@/server/social/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Slot = "eu_morning" | "us_morning";

function parseSlot(req: NextRequest): Slot | null {
  const slot = req.nextUrl.searchParams.get("slot");
  if (slot === "eu_morning" || slot === "us_morning") return slot;
  return null;
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // No secret configured = allow all
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Shared publish logic for both GET (Vercel cron) and POST (manual).
 */
async function handlePublish(req: NextRequest) {
  if (!isFacebookConfigured()) {
    return NextResponse.json(
      { error: "Facebook not configured. Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_TOKEN." },
      { status: 400 }
    );
  }

  const slot = parseSlot(req);
  if (!slot) {
    return NextResponse.json(
      { error: "Missing or invalid slot. Use ?slot=eu_morning or ?slot=us_morning" },
      { status: 400 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get("force") === "true";
  const dryRun = req.nextUrl.searchParams.get("dry") === "true";

  // Check event-driven schedule
  const schedule = await shouldPostNow(slot);

  if (!schedule.shouldPost && !force) {
    return NextResponse.json({
      slot,
      published: 0,
      skipped: true,
      reason: schedule.reason,
      event: schedule.eventTitle,
      daysFromRace: schedule.daysFromRace,
    });
  }

  const posts = await generateSlotPosts(slot);
  const limit = force ? posts.length : Math.min(posts.length, schedule.maxPosts);
  const toPublish = posts.slice(0, limit);

  if (toPublish.length === 0) {
    return NextResponse.json({
      slot,
      published: 0,
      message: "Nothing fresh to post",
      schedule: { reason: schedule.reason, event: schedule.eventTitle },
    });
  }

  // Dry run: preview without publishing
  if (dryRun) {
    return NextResponse.json({
      slot,
      dryRun: true,
      posts: toPublish,
      schedule: { reason: schedule.reason, event: schedule.eventTitle, daysFromRace: schedule.daysFromRace },
    });
  }

  const results = await publishMultiple(toPublish, 8000);

  return NextResponse.json({
    slot,
    published: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    schedule: {
      reason: schedule.reason,
      event: schedule.eventTitle,
      daysFromRace: schedule.daysFromRace,
    },
    results,
  });
}

/**
 * GET — called by Vercel Cron. Also supports ?dry=true for preview.
 */
export async function GET(req: NextRequest) {
  return handlePublish(req);
}

/**
 * POST — manual trigger.
 */
export async function POST(req: NextRequest) {
  return handlePublish(req);
}
