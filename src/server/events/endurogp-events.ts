import * as cheerio from "cheerio";
import type { EventScraper, EventScrapeResult, ParsedEvent } from "./types";

const API_BASE = "https://www.endurogp.com/wp-json/wp/v2/pages";
const SITE_URL = "https://www.endurogp.com";

export class EnduroGpEventScraper implements EventScraper {
  readonly sourceSlug = "endurogp";

  async scrape(): Promise<EventScrapeResult> {
    const errors: string[] = [];
    const events: ParsedEvent[] = [];

    try {
      const pages = await this.fetchJson<Array<{
        slug: string;
        title: { rendered: string };
        content: { rendered: string };
        link: string;
      }>>(`${API_BASE}?per_page=100&_fields=slug,title,content,link`);

      const roundPages = pages.filter((p) =>
        /^r\d+-\d{4}-gp-of-/.test(p.slug)
      );

      for (const page of roundPages) {
        try {
          const event = this.parsePage(page);
          if (event) events.push(event);
        } catch (err) {
          errors.push(
            `[${page.slug}]: ${err instanceof Error ? err.message : "parse error"}`
          );
        }
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Fetch error");
    }

    return { events, errors };
  }

  private parsePage(page: {
    slug: string;
    title: { rendered: string };
    content: { rendered: string };
    link: string;
  }): ParsedEvent | null {
    const title = this.decodeHtml(page.title.rendered).trim();
    if (!title) return null;

    const text = this.htmlToText(page.content.rendered);
    const yearMatch = page.slug.match(/r(\d+)-(\d{4})-gp-of-(.+)/);
    if (!yearMatch) return null;

    const [, roundNum, year, countrySlug] = yearMatch;
    const country = this.formatCountry(countrySlug);

    // Extract dates: "10 – 12 April 2026" pattern
    const dateMatch = text.match(
      /(\d{1,2})\s*[–-]\s*(\d{1,2})\s+(\w+)\s+(\d{4})/
    );
    let startDate: Date;
    let endDate: Date | null = null;

    if (dateMatch) {
      const [, startDay, endDay, month, yr] = dateMatch;
      startDate = new Date(`${startDay} ${month} ${yr}`);
      endDate = new Date(`${endDay} ${month} ${yr}`);
      if (isNaN(startDate.getTime())) return null;
    } else {
      // Fallback: try single date
      const singleMatch = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
      if (!singleMatch) return null;
      startDate = new Date(`${singleMatch[1]} ${singleMatch[2]} ${singleMatch[3]}`);
      if (isNaN(startDate.getTime())) return null;
    }

    // Extract venue from text
    const venueMatch = text.match(
      /(?:VENUE|venue)\s+(\w[\w\s]*?)(?:\s+is|\s+Round|\s+LIVE|\n|$)/
    );
    const venue = venueMatch ? venueMatch[1].trim() : null;

    const now = new Date();
    const status =
      endDate && endDate < now
        ? "completed"
        : startDate <= now && (!endDate || endDate >= now)
          ? "ongoing"
          : "upcoming";

    return {
      title: `EnduroGP Round ${roundNum} — GP of ${country}`,
      slug: `endurogp-${year}-r${roundNum}-${countrySlug}`,
      championship: "EnduroGP",
      discipline: "enduro",
      region: "global",
      country,
      venue,
      location: venue ? `${venue}, ${country}` : country,
      startDate,
      endDate,
      status,
      description: `Round ${roundNum} of the ${year} FIM EnduroGP World Championship in ${country}.`,
      eventUrl: page.link,
      imageUrl: null,
    };
  }

  private formatCountry(slug: string): string {
    return slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: { "User-Agent": "GnarlyGridNews/1.0", Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  private htmlToText(html: string): string {
    const $ = cheerio.load(html, null, false);
    return $.text().replace(/\s+/g, " ").trim();
  }

  private decodeHtml(str: string): string {
    const $ = cheerio.load(`<span>${str}</span>`, null, false);
    return $("span").text();
  }
}
