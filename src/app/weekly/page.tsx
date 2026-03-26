import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import {
  DigestSection,
  SignalList,
  DigestArticleList,
} from "@/components/digest-section";
import { buildMetadata } from "@/lib/seo";
import { getWeeklyDigest } from "@/server/digest";

export const metadata = buildMetadata({
  title: "Weekly Roundup",
  description:
    "This week in motocross and enduro — grouped stories, official updates, and sport highlights.",
  path: "/weekly",
});

export const dynamic = "force-dynamic";

export default async function WeeklyPage() {
  const digest = await getWeeklyDigest();

  const isEmpty =
    digest.topSignals.length === 0 &&
    digest.officialUpdates.length === 0 &&
    digest.enduroHighlights.length === 0 &&
    digest.mxHighlights.length === 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        title="Weekly Roundup"
        description="This week in motocross and enduro — the stories that matter, from multiple sources."
      />

      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href="/digest" className="text-neutral-400 hover:text-white">
          Daily digest &rarr;
        </Link>
        <Link href="/signals" className="text-neutral-400 hover:text-white">
          Signals &rarr;
        </Link>
        <Link href="/news" className="text-neutral-400 hover:text-white">
          All news &rarr;
        </Link>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
          No weekly content yet. Check back after sources have been synced.
        </div>
      ) : (
        <>
          {digest.topSignals.length > 0 && (
            <DigestSection title="Key Stories This Week" href="/signals">
              <SignalList groups={digest.topSignals} />
            </DigestSection>
          )}

          {digest.officialUpdates.length > 0 && (
            <DigestSection title="Official Updates" href="/official">
              <DigestArticleList articles={digest.officialUpdates} />
            </DigestSection>
          )}

          {digest.enduroHighlights.length > 0 && (
            <DigestSection title="Enduro This Week" href="/enduro">
              <DigestArticleList articles={digest.enduroHighlights} />
            </DigestSection>
          )}

          {digest.mxHighlights.length > 0 && (
            <DigestSection title="Motocross This Week" href="/mx">
              <DigestArticleList articles={digest.mxHighlights} />
            </DigestSection>
          )}

          {digest.swedenUpdates.length > 0 && (
            <DigestSection title="Sweden This Week" href="/news?region=sweden">
              <DigestArticleList articles={digest.swedenUpdates} />
            </DigestSection>
          )}
        </>
      )}
    </div>
  );
}
