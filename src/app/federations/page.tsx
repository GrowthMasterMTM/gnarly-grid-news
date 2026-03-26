import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { buildMetadata } from "@/lib/seo";
import { seedSources } from "@/config/sources";

export const metadata = buildMetadata({
  title: "Federations",
  description: "Official motorsport federations tracked by Gnarly Grid News.",
  path: "/federations",
});

const officialSources = seedSources.filter((s) => s.isOfficial);

export default function FederationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading
        title="Federations"
        description="Official motorsport federations and organizations we track."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {officialSources.map((source) => (
          <Link
            key={source.slug}
            href={`/sources/${source.slug}`}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 transition-colors hover:border-neutral-700"
          >
            <h3 className="text-lg font-semibold text-white">{source.name}</h3>
            <p className="mt-1 text-sm text-neutral-400">
              {source.description}
            </p>
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
