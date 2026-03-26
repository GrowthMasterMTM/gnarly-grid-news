import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { InsightCard } from "@/components/insight-card";
import { buildMetadata } from "@/lib/seo";
import {
  getStandings,
  getStandingsCategories,
} from "@/server/results/standings-queries";
import { getLatestInsights } from "@/server/results/queries";

interface StandingsDetailProps {
  params: Promise<{ championship: string }>;
  searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({ params }: StandingsDetailProps) {
  const { championship } = await params;
  const name = decodeURIComponent(championship);
  return buildMetadata({
    title: `${name} Standings`,
    description: `Championship standings for ${name}.`,
    path: `/standings/${championship}`,
  });
}

export const dynamic = "force-dynamic";

export default async function ChampionshipStandingsPage({
  params,
  searchParams,
}: StandingsDetailProps) {
  const { championship: rawChamp } = await params;
  const sp = await searchParams;
  const championship = decodeURIComponent(rawChamp);
  const season = sp.season ? parseInt(sp.season, 10) : undefined;

  const [categories, insights] = await Promise.all([
    getStandingsCategories(championship, season),
    getLatestInsights({ championship, sourceScope: "championship", limit: 4 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-4">
        <Link
          href="/standings"
          className="text-sm text-neutral-400 hover:text-white"
        >
          &larr; All Standings
        </Link>
      </div>

      <PageHeading
        title={`${championship} Standings`}
        description={`${season ?? new Date().getFullYear()} season standings.`}
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/events" className="text-neutral-400 hover:text-white">
          Events &rarr;
        </Link>
        <Link
          href={`/news?source=${championship.toLowerCase()}`}
          className="text-neutral-400 hover:text-white"
        >
          {championship} news &rarr;
        </Link>
      </div>

      {insights.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">
            Championship Insights
          </h2>
          <div className="flex flex-col gap-3">
            {insights.map((i) => (
              <InsightCard
                key={i.id}
                headline={i.headline}
                summary={i.summary}
                insightType={i.insightType}
                eventSlug={i.event?.slug}
                eventTitle={i.event?.title}
              />
            ))}
          </div>
        </section>
      )}

      {categories.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
          No standings data for {championship} yet.
        </div>
      ) : (
        categories.map((category) => (
          <StandingsTable
            key={category}
            championship={championship}
            category={category}
            season={season}
          />
        ))
      )}
    </div>
  );
}

async function StandingsTable({
  championship,
  category,
  season,
}: {
  championship: string;
  category: string;
  season?: number;
}) {
  const standings = await getStandings(championship, season, category);

  if (standings.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-white">{category}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 text-neutral-500">
            <tr>
              <th className="pb-2 pr-3 font-medium">Pos</th>
              <th className="pb-2 pr-3 font-medium">Rider</th>
              {standings.some((s) => s.riderCountry) && (
                <th className="pb-2 pr-3 font-medium">Country</th>
              )}
              {standings.some((s) => s.team) && (
                <th className="pb-2 pr-3 font-medium">Team</th>
              )}
              <th className="pb-2 pr-3 font-medium">Points</th>
              <th className="pb-2 pr-3 font-medium">Wins</th>
              <th className="pb-2 font-medium">Events</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {standings.map((s) => (
              <tr key={`${s.category}-${s.position}`}>
                <td className="py-2 pr-3 font-medium text-white">
                  {s.position}
                </td>
                <td className="py-2 pr-3 text-neutral-300">{s.riderName}</td>
                {standings.some((s2) => s2.riderCountry) && (
                  <td className="py-2 pr-3 text-neutral-400">
                    {s.riderCountry}
                  </td>
                )}
                {standings.some((s2) => s2.team) && (
                  <td className="py-2 pr-3 text-neutral-400">{s.team}</td>
                )}
                <td className="py-2 pr-3 font-medium text-white">
                  {s.totalPoints}
                </td>
                <td className="py-2 pr-3 text-neutral-400">{s.wins}</td>
                <td className="py-2 text-neutral-400">{s.eventsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
