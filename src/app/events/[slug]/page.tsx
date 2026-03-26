import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/dates";
import { getEventBySlug } from "@/server/events";
import { getEventInsights, getEventResults } from "@/server/results/queries";
import { InsightCard } from "@/components/insight-card";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) return buildMetadata({ title: "Event Not Found" });

  return buildMetadata({
    title: `${event.title} — ${event.championship}`,
    description:
      event.description ??
      `${event.championship} event at ${event.location ?? event.venue ?? "TBD"}.`,
    path: `/events/${slug}`,
  });
}

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const [insights, results] = await Promise.all([
    getEventInsights(event.id),
    getEventResults(event.id),
  ]);

  const dateRange = event.endDate
    ? `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`
    : formatDate(event.startDate);

  // Group results by category
  const categories = new Map<string, typeof results>();
  for (const r of results) {
    if (!categories.has(r.category)) categories.set(r.category, []);
    categories.get(r.category)!.push(r);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/events" className="text-neutral-400 hover:text-white">
          &larr; Events
        </Link>
        <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-300">
          {event.championship}
        </span>
        <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs capitalize text-neutral-300">
          {event.discipline}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            event.status === "upcoming"
              ? "bg-blue-900/30 text-blue-400"
              : event.status === "ongoing"
                ? "bg-green-900/30 text-green-400"
                : "bg-neutral-800 text-neutral-400"
          }`}
        >
          {event.status}
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-white">
        {event.title}
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Date</p>
          <p className="mt-1 font-medium text-white">{dateRange}</p>
        </div>
        {event.location && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500">Location</p>
            <p className="mt-1 font-medium text-white">{event.location}</p>
          </div>
        )}
        {event.venue && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500">Venue</p>
            <p className="mt-1 font-medium text-white">{event.venue}</p>
          </div>
        )}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Region</p>
          <p className="mt-1 font-medium capitalize text-white">
            {event.region}
          </p>
        </div>
      </div>

      {event.description && (
        <div className="mt-8">
          <p className="leading-relaxed text-neutral-300">
            {event.description}
          </p>
        </div>
      )}

      {insights.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-white">Analysis</h2>
          <div className="flex flex-col gap-3">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                headline={insight.headline}
                summary={insight.summary}
                insightType={insight.insightType}
              />
            ))}
          </div>
        </section>
      )}

      {categories.size > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-white">Results</h2>
          {[...categories.entries()].map(([category, catResults]) => (
            <div key={category} className="mb-6">
              <h3 className="mb-2 text-lg font-semibold text-neutral-300">
                {category}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-neutral-800 text-neutral-500">
                    <tr>
                      <th className="pb-2 pr-3 font-medium">Pos</th>
                      <th className="pb-2 pr-3 font-medium">Rider</th>
                      {catResults.some((r) => r.riderCountry) && (
                        <th className="pb-2 pr-3 font-medium">Country</th>
                      )}
                      {catResults.some((r) => r.team) && (
                        <th className="pb-2 pr-3 font-medium">Team</th>
                      )}
                      {catResults.some((r) => r.time) && (
                        <th className="pb-2 pr-3 font-medium">Time</th>
                      )}
                      {catResults.some((r) => r.gap) && (
                        <th className="pb-2 font-medium">Gap</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {catResults.map((r) => (
                      <tr key={`${r.category}-${r.position}`}>
                        <td className="py-2 pr-3 font-medium text-white">
                          {r.position}
                        </td>
                        <td className="py-2 pr-3 text-neutral-300">
                          {r.riderName}
                        </td>
                        {catResults.some((r2) => r2.riderCountry) && (
                          <td className="py-2 pr-3 text-neutral-400">
                            {r.riderCountry}
                          </td>
                        )}
                        {catResults.some((r2) => r2.team) && (
                          <td className="py-2 pr-3 text-neutral-400">
                            {r.team}
                          </td>
                        )}
                        {catResults.some((r2) => r2.time) && (
                          <td className="py-2 pr-3 text-neutral-400">
                            {r.time}
                          </td>
                        )}
                        {catResults.some((r2) => r2.gap) && (
                          <td className="py-2 text-neutral-400">{r.gap}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        {event.eventUrl && (
          <a
            href={event.eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white"
          >
            Official event page &rarr;
          </a>
        )}
        <Link
          href={`/news?sport=${event.discipline}`}
          className="text-neutral-400 hover:text-white"
        >
          {event.discipline} news &rarr;
        </Link>
        <Link href="/events" className="text-neutral-400 hover:text-white">
          All events &rarr;
        </Link>
      </div>
    </div>
  );
}
