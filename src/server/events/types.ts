export interface ParsedEvent {
  title: string;
  slug: string;
  championship: string;
  discipline: string;
  region: string;
  country: string | null;
  venue: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  description: string | null;
  eventUrl: string | null;
  imageUrl: string | null;
}

export interface EventScrapeResult {
  events: ParsedEvent[];
  errors: string[];
}

export interface EventScraper {
  readonly sourceSlug: string;
  scrape(): Promise<EventScrapeResult>;
}
