import { prisma, safeQuery } from "@/lib/db";

export async function getUpcomingEvents(limit: number = 10) {
  const result = await safeQuery(() =>
    prisma.event.findMany({
      where: {
        status: { in: ["upcoming", "ongoing"] },
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
      take: limit,
    })
  );
  return result ?? [];
}

export async function getEventBySlug(slug: string) {
  return safeQuery(() =>
    prisma.event.findUnique({ where: { slug } })
  );
}

export async function getEventsByChampionship(
  championship: string,
  limit: number = 20
) {
  const result = await safeQuery(() =>
    prisma.event.findMany({
      where: { championship },
      orderBy: { startDate: "asc" },
      take: limit,
    })
  );
  return result ?? [];
}

export async function getEventsByDiscipline(
  discipline: string,
  limit: number = 20
) {
  const result = await safeQuery(() =>
    prisma.event.findMany({
      where: { discipline },
      orderBy: { startDate: "asc" },
      take: limit,
    })
  );
  return result ?? [];
}

export async function getAllEvents(options?: {
  status?: string;
  discipline?: string;
  limit?: number;
}) {
  const { status, discipline, limit = 50 } = options ?? {};

  const result = await safeQuery(() =>
    prisma.event.findMany({
      where: {
        ...(status && { status }),
        ...(discipline && { discipline }),
      },
      orderBy: { startDate: "asc" },
      take: limit,
    })
  );
  return result ?? [];
}

export async function getNextEvent(championship: string) {
  return safeQuery(() =>
    prisma.event.findFirst({
      where: {
        championship,
        status: "upcoming",
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
    })
  );
}
