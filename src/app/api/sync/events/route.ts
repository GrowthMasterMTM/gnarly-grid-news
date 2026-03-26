import { NextResponse } from "next/server";
import { syncAllEvents } from "@/server/events/sync-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await syncAllEvents();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Event sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
