import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { buildMetadata } from "@/lib/seo";
import { getChampionships } from "@/server/results/standings-queries";

export const metadata = buildMetadata({
  title: "Standings",
  description:
    "Championship standings for EnduroGP, SuperEnduro, DEM, MXGP, and more.",
  path: "/standings",
});

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const championships = await getChampionships();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading
        title="Standings"
        description="Championship standings computed from official results."
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/events" className="text-neutral-400 hover:text-white">
          Events &rarr;
        </Link>
        <Link href="/news" className="text-neutral-400 hover:text-white">
          News &rarr;
        </Link>
      </div>

      {championships.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
          No standings data yet. Standings are computed from event results.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {championships.map((c) => (
            <Link
              key={`${c.championship}-${c.season}`}
              href={`/standings/${encodeURIComponent(c.championship)}?season=${c.season}`}
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 transition-colors hover:border-neutral-700"
            >
              <h3 className="text-lg font-semibold text-white">
                {c.championship}
              </h3>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-300">
                  {c.season}
                </span>
                <span className="rounded-full bg-neutral-800 px-2 py-0.5 capitalize text-neutral-300">
                  {c.discipline}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
