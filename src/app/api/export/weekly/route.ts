import { NextResponse } from "next/server";
import { getWeeklyDigest } from "@/server/digest";
import { exportDigest } from "@/server/export/digest-export";
import { formatDigestAsPlainText } from "@/server/export/plain-text";
import { formatDigestAsHtml } from "@/server/export/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const digest = await getWeeklyDigest();
  const exported = exportDigest(digest, "Weekly Roundup");

  if (format === "text") {
    return new Response(formatDigestAsPlainText(exported), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (format === "html") {
    return new Response(formatDigestAsHtml(exported), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json(exported);
}
