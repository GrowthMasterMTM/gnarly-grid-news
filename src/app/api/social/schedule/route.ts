import { NextResponse } from "next/server";
import { getUpcomingSchedule, shouldPostNow } from "@/server/social/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/social/schedule
 *
 * Preview the upcoming posting schedule — shows which days
 * will have posts and how many, based on the event calendar.
 */
export async function GET() {
  const [todayEU, todayUS, upcoming] = await Promise.all([
    shouldPostNow("eu_morning"),
    shouldPostNow("us_morning"),
    getUpcomingSchedule(),
  ]);

  return NextResponse.json({
    today: {
      eu_morning: todayEU,
      us_morning: todayUS,
    },
    upcoming,
  });
}
