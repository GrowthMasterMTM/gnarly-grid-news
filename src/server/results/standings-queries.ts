import { prisma, safeQuery } from "@/lib/db";

export async function getStandings(
  championship: string,
  season?: number,
  category?: string
) {
  const yr = season ?? new Date().getFullYear();

  const result = await safeQuery(() =>
    prisma.standing.findMany({
      where: {
        championship,
        season: yr,
        ...(category && { category }),
      },
      orderBy: [{ category: "asc" }, { position: "asc" }],
    })
  );
  return result ?? [];
}

export async function getChampionships() {
  const result = await safeQuery(async () => {
    const raw = await prisma.standing.findMany({
      select: {
        championship: true,
        discipline: true,
        season: true,
      },
      distinct: ["championship", "season"],
      orderBy: [{ season: "desc" }, { championship: "asc" }],
    });
    return raw;
  });
  return result ?? [];
}

export async function getStandingsCategories(
  championship: string,
  season?: number
) {
  const yr = season ?? new Date().getFullYear();

  const result = await safeQuery(async () => {
    const raw = await prisma.standing.findMany({
      where: { championship, season: yr },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return raw.map((r) => r.category);
  });
  return result ?? [];
}

export async function getTopRiders(
  championship: string,
  category: string,
  limit: number = 3,
  season?: number
) {
  const yr = season ?? new Date().getFullYear();

  const result = await safeQuery(() =>
    prisma.standing.findMany({
      where: { championship, season: yr, category },
      orderBy: { position: "asc" },
      take: limit,
    })
  );
  return result ?? [];
}
