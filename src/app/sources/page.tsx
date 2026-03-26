import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { buildMetadata } from "@/lib/seo";
import { seedSources } from "@/config/sources";

export const metadata = buildMetadata({
  title: "Sources",
  description: "All news sources tracked by Gnarly Grid News.",
  path: "/sources",
});

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading
        title="Sources"
        description="News sources we aggregate from across the motorsport world."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {seedSources.map((source) => (
          <Link
            key={source.slug}
            href={`/sources/${source.slug}`}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 transition-colors hover:border-neutral-700"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {source.name}
              </h3>
              {source.isOfficial && (
                <span className="rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                  Official
                </span>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                {source.region}
              </span>
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                {source.sportFocus}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
