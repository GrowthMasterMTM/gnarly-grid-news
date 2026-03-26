import { prisma } from "@/lib/db";
import { normalizeTitle } from "@/lib/slug";
import { shortHash } from "@/lib/hash";
import type { NormalizedArticle } from "./normalize";

export interface DedupResult {
  isDuplicate: boolean;
  duplicateGroupKey: string | null;
  reason: string | null;
}

export async function checkDuplicate(
  article: NormalizedArticle
): Promise<DedupResult> {
  // Check 1: exact URL match
  const byUrl = await prisma.article.findUnique({
    where: { url: article.url },
    select: { id: true },
  });
  if (byUrl) {
    return {
      isDuplicate: true,
      duplicateGroupKey: null,
      reason: "url",
    };
  }

  // Check 2: contentHash match
  const byHash = await prisma.article.findFirst({
    where: { contentHash: article.contentHash },
    select: { id: true, slug: true },
  });
  if (byHash) {
    return {
      isDuplicate: true,
      duplicateGroupKey: shortHash(article.contentHash, 16),
      reason: "contentHash",
    };
  }

  // Check 3: normalized title similarity (same title from different URLs)
  const normalized = normalizeTitle(article.title);
  if (normalized.length > 10) {
    const titleKey = shortHash(normalized, 16);
    const byTitle = await prisma.article.findFirst({
      where: {
        duplicateGroupKey: titleKey,
      },
      select: { id: true },
    });
    if (byTitle) {
      return {
        isDuplicate: true,
        duplicateGroupKey: titleKey,
        reason: "title",
      };
    }
    // Return the titleKey so it can be stored for future dedup checks
    return {
      isDuplicate: false,
      duplicateGroupKey: titleKey,
      reason: null,
    };
  }

  return { isDuplicate: false, duplicateGroupKey: null, reason: null };
}
