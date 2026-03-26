import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { EventCard } from "@/components/event-card";
import { buildMetadata } from "@/lib/seo";
import { getAllEvents, getUpcomingEvents } from "@/server/events";

export const metadata = buildMetadata({
  title: "Events",
  description:
    "Upcoming motocross and enduro events — EnduroGP, SuperEnduro, DEM, MXGP, and more.",
  path: "/events",
});

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(20),
    getAllEvents({ status: "completed", limit: 10 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading
        title="Events"
        description="Upcoming and recent motocross and enduro events from championships worldwide."
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/news" className="text-neutral-400 hover:text-white">
          News &rarr;
        </Link>
        <Link href="/signals" className="text-neutral-400 hover:text-white">
          Signals &rarr;
        </Link>
        <Link href="/digest" className="text-neutral-400 hover:text-white">
          Digest &rarr;
        </Link>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-white">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
            No upcoming events at the moment.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((event) => (
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
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-white">Recent</h2>
          <div className="flex flex-col gap-3">
            {past.map((event) => (
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
    </div>
  );
}
