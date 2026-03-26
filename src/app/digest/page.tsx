import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import {
  DigestSection,
  SignalList,
  DigestArticleList,
} from "@/components/digest-section";
import { InsightCard } from "@/components/insight-card";
import { buildMetadata } from "@/lib/seo";
import { getExpandedDigest } from "@/server/digest";

export const metadata = buildMetadata({
  title: "Daily Digest",
  description:
    "Your motorsport briefing — top signals, official updates, and highlights from enduro and motocross.",
  path: "/digest",
});

export const dynamic = "force-dynamic";

export default async function DigestPage() {
  const digest = await getExpandedDigest();

  const isEmpty =
    digest.topSignals.length === 0 &&
    digest.officialUpdates.length === 0 &&
    digest.enduroHighlights.length === 0 &&
    digest.mxHighlights.length === 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        title="Digest"
        description="Your motorsport briefing — the most important stories, official updates, and sport highlights."
      />

      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href="/signals" className="text-neutral-400 hover:text-white">
          Signals &rarr;
        </Link>
        <Link href="/official" className="text-neutral-400 hover:text-white">
          Official &rarr;
        </Link>
        <Link href="/weekly" className="text-neutral-400 hover:text-white">
          Weekly &rarr;
        </Link>
        <Link href="/news" className="text-neutral-400 hover:text-white">
          All news &rarr;
        </Link>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
          No digest content yet. Articles will appear here after sources are
          synced.
        </div>
      ) : (
        <>
          {digest.topSignals.length > 0 && (
            <DigestSection title="Top Signals" href="/signals">
              <SignalList groups={digest.topSignals} />
            </DigestSection>
          )}

          {digest.latestInsights.length > 0 && (
            <DigestSection title="Latest Results" href="/events">
              <div className="flex flex-col gap-3">
                {digest.latestInsights.map((insight, i) => (
                  <InsightCard
                    key={i}
                    headline={insight.headline}
                    summary={insight.summary}
                    insightType={insight.insightType}
                    eventSlug={insight.eventSlug}
                    eventTitle={insight.eventTitle}
                  />
                ))}
              </div>
            </DigestSection>
          )}

          {digest.officialUpdates.length > 0 && (
            <DigestSection title="Official Updates" href="/official">
              <DigestArticleList articles={digest.officialUpdates} />
            </DigestSection>
          )}

          <div className="mb-10 grid gap-8 lg:grid-cols-2">
            {digest.enduroHighlights.length > 0 && (
              <DigestSection title="Enduro" href="/enduro">
                <DigestArticleList articles={digest.enduroHighlights} />
              </DigestSection>
            )}
            {digest.mxHighlights.length > 0 && (
              <DigestSection title="Motocross" href="/mx">
                <DigestArticleList articles={digest.mxHighlights} />
              </DigestSection>
            )}
          </div>

          {digest.swedenUpdates.length > 0 && (
            <DigestSection title="Sweden" href="/news?region=sweden">
              <DigestArticleList articles={digest.swedenUpdates} />
            </DigestSection>
          )}
        </>
      )}
    </div>
  );
}
