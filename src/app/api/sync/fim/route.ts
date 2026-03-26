import { NextResponse } from "next/server";
import { runSync } from "@/server/sync/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handler() {
  try {
    const result = await runSync("fim-news");
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export { handler as GET, handler as POST };
