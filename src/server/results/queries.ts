import { prisma, safeQuery } from "@/lib/db";

export async function getEventInsights(eventId: string) {
  const result = await safeQuery(() =>
    prisma.resultInsight.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    })
  );
  return result ?? [];
}

export async function getEventResults(eventId: string) {
  const result = await safeQuery(() =>
    prisma.result.findMany({
      where: { eventId },
      orderBy: [{ category: "asc" }, { position: "asc" }],
    })
  );
  return result ?? [];
}

export async function getLatestInsights(options?: {
  championship?: string;
  discipline?: string;
  sourceScope?: string;
  limit?: number;
}) {
  const { championship, discipline, sourceScope, limit = 10 } = options ?? {};

  const result = await safeQuery(() =>
    prisma.resultInsight.findMany({
      where: {
        ...(championship && { championship }),
        ...(discipline && { discipline }),
        ...(sourceScope && { sourceScope }),
      },
      include: {
        event: {
          select: { title: true, slug: true, championship: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  );
  return result ?? [];
}

export async function getInsightsByType(
  insightType: string,
  limit: number = 10
) {
  const result = await safeQuery(() =>
    prisma.resultInsight.findMany({
      where: { insightType },
      include: {
        event: {
          select: { title: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  );
  return result ?? [];
}
