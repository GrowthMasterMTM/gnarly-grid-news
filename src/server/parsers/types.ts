export interface ParsedArticle {
  title: string;
  url: string;
  publishedAt: string | null;
  contentHtml: string | null;
  contentText: string | null;
  imageUrl: string | null;
  sport: string;
  category: string;
}

export interface ParseResult {
  articles: ParsedArticle[];
  errors: string[];
}

export interface Parser {
  readonly key: string;
  parse(): Promise<ParseResult>;
}
