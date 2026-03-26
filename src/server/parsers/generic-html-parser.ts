import type { Parser, ParseResult } from "./types";

/**
 * Generic HTML parser for sources that use standard HTML scraping.
 * Will be implemented when additional sources are added.
 */
export class GenericHtmlParser implements Parser {
  readonly key: string;

  constructor(
    key: string,
    private readonly config: {
      listUrl: string;
      articleSelector: string;
      titleSelector: string;
      linkSelector: string;
      dateSelector?: string;
      imageSelector?: string;
    }
  ) {
    this.key = key;
    // Config stored for future implementation
    void this.config;
  }

  async parse(): Promise<ParseResult> {
    return {
      articles: [],
      errors: [`GenericHtmlParser not yet implemented for: ${this.key}`],
    };
  }
}
