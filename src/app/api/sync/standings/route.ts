import { NextResponse } from "next/server";
import { calculateAllStandings } from "@/server/results/calculate-standings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await calculateAllStandings();
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Standings calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
