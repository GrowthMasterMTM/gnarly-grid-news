import { prisma, safeQuery } from "@/lib/db";
import type { EventScraper, ParsedEvent } from "./types";
import { EnduroGpEventScraper } from "./endurogp-events";
import { SuperEnduroEventScraper } from "./superenduro-events";
import { DemEventScraper } from "./dem-events";

const scrapers: EventScraper[] = [
  new EnduroGpEventScraper(),
  new SuperEnduroEventScraper(),
  new DemEventScraper(),
];

export interface EventSyncResult {
  created: number;
  updated: number;
  errors: string[];
  durationMs: number;
}

/**
 * Sync events from all configured source scrapers.
 * Uses upsert to avoid duplicates — slug is the stable key.
 */
export async function syncAllEvents(): Promise<EventSyncResult> {
  const start = Date.now();
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const scraper of scrapers) {
    try {
      const result = await scraper.scrape();
      errors.push(
        ...result.errors.map((e) => `[${scraper.sourceSlug}] ${e}`)
      );

      // Look up source ID if exists
      const source = await safeQuery(() =>
        prisma.source.findUnique({
          where: { slug: scraper.sourceSlug },
          select: { id: true },
        })
      );

      for (const event of result.events) {
        try {
          const counts = await upsertEvent(event, source?.id ?? null);
          created += counts.created;
          updated += counts.updated;
        } catch (err) {
          errors.push(
            `[${scraper.sourceSlug}] ${event.slug}: ${err instanceof Error ? err.message : "upsert error"}`
          );
        }
      }
    } catch (err) {
      errors.push(
        `[${scraper.sourceSlug}] scraper failed: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  }

  return { created, updated, errors, durationMs: Date.now() - start };
}

async function upsertEvent(
  event: ParsedEvent,
  sourceId: string | null
): Promise<{ created: number; updated: number }> {
  const existing = await prisma.event.findUnique({
    where: { slug: event.slug },
  });

  const data = {
    title: event.title,
    championship: event.championship,
    discipline: event.discipline,
    region: event.region,
    country: event.country,
    venue: event.venue,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    status: event.status,
    description: event.description,
    eventUrl: event.eventUrl,
    imageUrl: event.imageUrl,
    sourceId,
  };

  if (existing) {
    await prisma.event.update({
      where: { slug: event.slug },
      data,
    });
    return { created: 0, updated: 1 };
  }

  await prisma.event.create({
    data: { slug: event.slug, ...data },
  });
  return { created: 1, updated: 0 };
}
