import * as cheerio from "cheerio";
import type { EventScraper, EventScrapeResult, ParsedEvent } from "./types";

const SCHEDULE_URL = "https://superenduro.org/schedule/";

export class SuperEnduroEventScraper implements EventScraper {
  readonly sourceSlug = "superenduro";

  async scrape(): Promise<EventScrapeResult> {
    const errors: string[] = [];
    const events: ParsedEvent[] = [];

    try {
      const html = await this.fetchPage(SCHEDULE_URL);
      const $ = cheerio.load(html);

      // Structure: <h2><span>DATE</span></h2> followed by <p>Round N</p>
      // and ticket links with "GP of COUNTRY" in title attribute
      const headings = $("h2 span").toArray();

      for (const h of headings) {
        const dateText = $(h).text().trim();
        const dateMatch = dateText.match(/(\d{1,2})\s+(\w+)\s+(20\d{2})/);
        if (!dateMatch) continue;

        const [, day, month, year] = dateMatch;
        const startDate = new Date(`${day} ${month} ${year}`);
        if (isNaN(startDate.getTime())) continue;

        // Find the nearest "Round N" text
        const container = $(h).closest(".uncont, .uncell, div");
        const roundText = container.text();
        const roundMatch = roundText.match(/Round\s+(\d+)/);
        if (!roundMatch) continue;
        const roundNum = parseInt(roundMatch[1], 10);

        // Find country from ticket link title or "more info" link
        let country: string | null = null;
        const ticketLink = container.find("a[title*='GP of']");
        if (ticketLink.length) {
          const titleAttr = ticketLink.attr("title") ?? "";
          const gpMatch = titleAttr.match(/GP\s+of\s+(\w[\w\s]*?)(?:\s+20|\s*$)/i);
          if (gpMatch) country = gpMatch[1].trim();
        }

        // Also check "more info" link href for country
        if (!country) {
          const infoLink = container.find("a[href*='/schedule/gp-']");
          if (infoLink.length) {
            const href = infoLink.attr("href") ?? "";
            const slugMatch = href.match(/gp-(\w+)/);
            if (slugMatch) {
              country = slugMatch[1].charAt(0).toUpperCase() + slugMatch[1].slice(1);
            }
          }
        }

        const now = new Date();
        const status = startDate < now ? "completed" : "upcoming";

        const title = country
          ? `SuperEnduro Round ${roundNum} — GP of ${country}`
          : `SuperEnduro Round ${roundNum}`;

        const slug = `superenduro-${year}-r${roundNum}${country ? `-${country.toLowerCase().replace(/\s+/g, "-")}` : ""}`;

        // Skip if already added
        if (events.some((e) => e.slug === slug)) continue;

        events.push({
          title,
          slug,
          championship: "SuperEnduro",
          discipline: "enduro",
          region: "europe",
          country,
          venue: null,
          location: country,
          startDate,
          endDate: null,
          status,
          description: `Round ${roundNum} of the FIM SuperEnduro World Championship ${year}.`,
          eventUrl: SCHEDULE_URL,
          imageUrl: null,
        });
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Fetch error");
    }

    return { events, errors };
  }

  private async fetchPage(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: { "User-Agent": "GnarlyGridNews/1.0", Accept: "text/html" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
}
