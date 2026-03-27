import { prisma } from "@/lib/db";
import { withTimeout } from "@/lib/timeout";
import { getParser } from "@/server/parsers/registry";
import {
  normalizeArticle,
  validateParsedArticle,
  isAdvertisingContent,
} from "@/server/sync/normalize";
import { checkDuplicate } from "@/server/sync/dedup";
import { updateStoryGroups } from "@/server/groups/update-groups";

const PARSE_TIMEOUT_MS = 30_000;

export interface SyncResult {
  sourceSlug: string;
  articlesFound: number;
  articlesCreated: number;
  articlesSkipped: number;
  articlesDuplicate: number;
  articlesInvalid: number;
  articlesFiltered: number;
  errors: string[];
  durationMs: number;
}

export async function runSync(sourceSlug: string): Promise<SyncResult> {
  const start = Date.now();
  const errors: string[] = [];
  let articlesFound = 0;
  let articlesCreated = 0;
  let articlesSkipped = 0;
  let articlesDuplicate = 0;
  let articlesInvalid = 0;
  let articlesFiltered = 0;

  const source = await prisma.source.findUnique({
    where: { slug: sourceSlug },
  });

  if (!source) {
    return emptyResult(sourceSlug, [`Source not found: ${sourceSlug}`], start);
  }

  const syncRun = await prisma.syncRun.create({
    data: { sourceId: source.id, status: "running" },
  });

  try {
    const parser = getParser(source.parserKey);
    const parseResult = await withTimeout(parser.parse(), PARSE_TIMEOUT_MS);

    articlesFound = parseResult.articles.length;
    errors.push(...parseResult.errors);

    for (const parsed of parseResult.articles) {
      try {
        // Filter advertising/sponsored content first
        if (isAdvertisingContent(parsed)) {
          articlesFiltered++;
          continue;
        }

        // Validate before normalizing
        const validationError = validateParsedArticle(parsed);
        if (validationError) {
          articlesInvalid++;
          errors.push(
            `[invalid] ${validationError.field}: ${validationError.message}`
          );
          continue;
        }

        const normalized = normalizeArticle(
          parsed,
          source.slug,
          source.region
        );

        // Dedup check
        const dedup = await checkDuplicate(normalized);
        if (dedup.isDuplicate) {
          if (dedup.reason === "url") {
            articlesSkipped++;
          } else {
            articlesDuplicate++;
          }
          continue;
        }

        await prisma.article.create({
          data: {
            title: normalized.title,
            slug: normalized.slug,
            url: normalized.url,
            contentHash: normalized.contentHash,
            contentHtml: normalized.contentHtml,
            contentText: normalized.contentText,
            summary: normalized.summary,
            imageUrl: normalized.imageUrl,
            publishedAt: normalized.publishedAt,
            sport: normalized.sport,
            region: normalized.region,
            category: normalized.category,
            sourceId: source.id,
            isDuplicate: false,
            duplicateGroupKey: dedup.duplicateGroupKey,
          },
        });
        articlesCreated++;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        if (message.includes("Unique constraint")) {
          articlesSkipped++;
        } else {
          const title = parsed.title?.slice(0, 50) ?? "unknown";
          errors.push(`[${title}]: ${message}`);
        }
      }
    }

    const durationMs = Date.now() - start;

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: errors.length > 0 ? "completed_with_errors" : "completed",
        articlesFound,
        articlesAdded: articlesCreated,
        completedAt: new Date(),
        durationMs,
        errorMessage:
          errors.length > 0 ? errors.slice(0, 20).join("\n") : null,
      },
    });

    await prisma.source.update({
      where: { id: source.id },
      data: { lastSyncedAt: new Date() },
    });

    // Update story group summaries after sync
    await updateStoryGroups().catch(() => {});

    return {
      sourceSlug,
      articlesFound,
      articlesCreated,
      articlesSkipped,
      articlesDuplicate,
      articlesInvalid,
      articlesFiltered,
      errors,
      durationMs,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown sync error";
    errors.push(message);
    const durationMs = Date.now() - start;

    await prisma.syncRun
      .update({
        where: { id: syncRun.id },
        data: {
          status: "failed",
          errorMessage: message,
          completedAt: new Date(),
          durationMs,
        },
      })
      .catch(() => {});

    return {
      sourceSlug,
      articlesFound,
      articlesCreated,
      articlesSkipped,
      articlesDuplicate,
      articlesInvalid,
      articlesFiltered,
      errors,
      durationMs,
    };
  }
}

function emptyResult(
  sourceSlug: string,
  errors: string[],
  start: number
): SyncResult {
  return {
    sourceSlug,
    articlesFound: 0,
    articlesCreated: 0,
    articlesSkipped: 0,
    articlesDuplicate: 0,
    articlesInvalid: 0,
    articlesFiltered: 0,
    errors,
    durationMs: Date.now() - start,
  };
}

