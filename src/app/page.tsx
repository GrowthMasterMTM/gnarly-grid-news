import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { ArticleSection } from "@/components/article-section";
import { StoryGroupCard } from "@/components/story-group-card";
import { EventCard } from "@/components/event-card";
import { getArticles, getStoryGroups } from "@/server/queries";
import { getUpcomingEvents } from "@/server/events";

export const metadata = buildMetadata({
  description:
    "Aggregated motocross and enduro news from Svemo, FIM, EnduroGP, and more. Sweden, Europe, and global coverage.",
});

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [latest, official, enduro, mx, sweden, storyGroups, upcomingEvents] =
    await Promise.all([
      getArticles({ page: 1, limit: 6 }),
      getArticles({ page: 1, limit: 4, officialOnly: true }),
      getArticles({ page: 1, limit: 4, sport: "enduro" }),
      getArticles({ page: 1, limit: 4, sport: "motocross" }),
      getArticles({ page: 1, limit: 4, region: "sweden" }),
      getStoryGroups({ limit: 3 }),
      getUpcomingEvents(4),
    ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <section className="mb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Gnarly Grid News
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
          Aggregated motocross and enduro news from official federations and top
          sources across Sweden, Europe, and the US.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/mx"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
          >
            Motocross
          </Link>
          <Link
            href="/enduro"
            className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-white transition-colors hover:border-neutral-500"
          >
            Enduro
          </Link>
          <Link
            href="/signals"
            className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-white transition-colors hover:border-neutral-500"
          >
            Signals
          </Link>
          <Link
            href="/news"
            className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-white transition-colors hover:border-neutral-500"
          >
            All News
          </Link>
        </div>
      </section>

      <ArticleSection
        title="Latest News"
        href="/news"
        articles={latest.articles}
        emptyMessage="No articles yet. Run a sync to fetch news."
      />

      {storyGroups.groups.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Signals</h2>
            <Link
              href="/signals"
              className="text-sm text-neutral-400 hover:text-white"
            >
              View all &rarr;
            </Link>
          </div>
          <p className="mb-4 text-sm text-neutral-500">
            Stories covered by multiple sources
          </p>
          <div className="flex flex-col gap-3">
            {storyGroups.groups.map((group) => (
              <StoryGroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      <ArticleSection
        title="Official Updates"
        href="/official"
        articles={official.articles}
        emptyMessage="No official updates yet."
      />

      <div className="mb-12 grid gap-8 lg:grid-cols-2">
        <div>
          <ArticleSection
            title="Enduro"
            href="/enduro"
            articles={enduro.articles}
          />
        </div>
        <div>
          <ArticleSection
            title="Motocross"
            href="/mx"
            articles={mx.articles}
          />
        </div>
      </div>

      <ArticleSection
        title="Sweden"
        href="/news?region=sweden"
        articles={sweden.articles}
        emptyMessage="No Swedish news yet."
      />

      {upcomingEvents.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
            <Link
              href="/events"
              className="text-sm text-neutral-400 hover:text-white"
            >
              All events &rarr;
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                slug={event.slug}
                championship={event.championship}
                discipline={event.discipline}
                location={event.location}
                startDate={event.startDate}
                endDate={event.endDate}
                status={event.status}
              />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-3">
        <Link
          href="/sources"
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 transition-colors hover:border-neutral-700"
        >
          <h3 className="mb-2 text-lg font-semibold text-white">Sources</h3>
          <p className="text-sm text-neutral-400">
            Svemo, FIM, EnduroGP, and more.
          </p>
        </Link>
        <Link
          href="/signals"
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 transition-colors hover:border-neutral-700"
        >
          <h3 className="mb-2 text-lg font-semibold text-white">Signals</h3>
          <p className="text-sm text-neutral-400">
            Multi-source story intelligence.
          </p>
        </Link>
        <Link
          href="/federations"
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 transition-colors hover:border-neutral-700"
        >
          <h3 className="mb-2 text-lg font-semibold text-white">
            Federations
          </h3>
          <p className="text-sm text-neutral-400">
            Official motorsport federations we track.
          </p>
        </Link>
      </section>
    </div>
  );
}
