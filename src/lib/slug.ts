const SWEDISH_MAP: Record<string, string> = {
  å: "a",
  ä: "a",
  ö: "o",
  Å: "a",
  Ä: "a",
  Ö: "o",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[åäöÅÄÖ]/g, (char) => SWEDISH_MAP[char] ?? char)
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function articleSlug(
  title: string,
  sourceSlug: string,
  publishedAt: Date | null
): string {
  const base = slugify(title).slice(0, 72).replace(/-$/, "");
  const datePart = publishedAt
    ? publishedAt.toISOString().slice(0, 10)
    : "undated";
  return `${base}-${datePart}-${sourceSlug}`;
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
