import * as cheerio from "cheerio";
import type { EventScraper, EventScrapeResult, ParsedEvent } from "./types";

const DEM_CALENDAR_URL = "https://www.enduro-dm.de/de/termine/terminkalender";
const DEM_BASE_URL = "https://www.enduro-dm.de";

interface DemEventJson {
  eventId: number;
  eventHtml: string;
}

export class DemEventScraper implements EventScraper {
  readonly sourceSlug = "dem";

  async scrape(): Promise<EventScrapeResult> {
    const errors: string[] = [];
    const events: ParsedEvent[] = [];

    try {
      const html = await this.fetchPage(DEM_CALENDAR_URL);

      // Extract the JSON array of events embedded in the page
      const jsonMatch = html.match(/\[\s*\{\s*"eventId"[\s\S]*?\}\s*\]/);
      if (!jsonMatch) {
        return { events: [], errors: ["No event JSON found on calendar page"] };
      }

      const eventData: DemEventJson[] = JSON.parse(jsonMatch[0]);

      for (const item of eventData) {
        try {
          const event = this.parseEventHtml(item);
          if (event) events.push(event);
        } catch (err) {
          errors.push(
            `[event ${item.eventId}]: ${err instanceof Error ? err.message : "parse error"}`
          );
        }
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Fetch error");
    }

    return { events, errors };
  }

  private parseEventHtml(item: DemEventJson): ParsedEvent | null {
    const $ = cheerio.load(item.eventHtml, null, false);

    const title = $("span[itemprop='headline']").text().trim();
    if (!title) return null;

    const startDateStr = $("time[itemprop='dateStart']").attr("datetime");
    if (!startDateStr) return null;

    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) return null;

    const endDateStr = $("time[itemprop='dateEnd']").attr("datetime");
    const endDate = endDateStr ? new Date(endDateStr) : null;

    const location = $(".gwevent-preview__data--location")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const href = $(".gwevent-preview__link").attr("href");
    const eventUrl = href ? `${DEM_BASE_URL}${href}` : null;

    const now = new Date();
    const status =
      (endDate ?? startDate) < now ? "completed" : "upcoming";

    // Create a stable slug from event ID
    const slug = `dem-event-${item.eventId}`;

    return {
      title,
      slug,
      championship: "DEM",
      discipline: "enduro",
      region: "europe",
      country: "Germany",
      venue: location || null,
      location: location ? `${location}, Germany` : "Germany",
      startDate,
      endDate,
      status,
      description: `${title} — Deutsche Enduro Meisterschaft.`,
      eventUrl,
      imageUrl: null,
    };
  }

  private async fetchPage(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: { "User-Agent": "GnarlyGridNews/1.0", Accept: "text/html" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
}
