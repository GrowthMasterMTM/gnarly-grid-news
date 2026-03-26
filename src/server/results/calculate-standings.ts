/**
 * Championship standings calculation engine.
 * Aggregates results across events to compute rider standings.
 */

import { prisma } from "@/lib/db";

export interface StandingsCalcResult {
  updated: number;
  championships: number;
  errors: string[];
}

export async function calculateAllStandings(): Promise<StandingsCalcResult> {
  const errors: string[] = [];
  let updated = 0;
  const championshipSet = new Set<string>();

  // Get all events with results
  const events = await prisma.event.findMany({
    where: {
      results: { some: {} },
    },
    select: {
      id: true,
      championship: true,
      discipline: true,
      startDate: true,
    },
  });

  // Group events by championship
  const byChampionship = new Map<
    string,
    Array<{ id: string; discipline: string; startDate: Date }>
  >();
  for (const e of events) {
    if (!byChampionship.has(e.championship)) {
      byChampionship.set(e.championship, []);
    }
    byChampionship.get(e.championship)!.push(e);
  }

  for (const [championship, champEvents] of byChampionship) {
    try {
      const discipline = champEvents[0].discipline;
      const season = Math.max(
        ...champEvents.map((e) => e.startDate.getFullYear())
      );
      const eventIds = champEvents.map((e) => e.id);

      // Get all results for this championship
      const results = await prisma.result.findMany({
        where: { eventId: { in: eventIds } },
        orderBy: [{ category: "asc" }, { position: "asc" }],
      });

      if (results.length === 0) continue;

      // Aggregate by category + rider
      const aggregated = aggregateResults(results);

      // Upsert standings
      for (const entry of aggregated) {
        await prisma.standing.upsert({
          where: {
            championship_season_category_riderName: {
              championship,
              season,
              category: entry.category,
              riderName: entry.riderName,
            },
          },
          update: {
            position: entry.position,
            totalPoints: entry.totalPoints,
            eventsCount: entry.eventsCount,
            wins: entry.wins,
            podiums: entry.podiums,
            riderCountry: entry.riderCountry,
            team: entry.team,
            discipline,
            lastUpdatedAt: new Date(),
          },
          create: {
            championship,
            discipline,
            season,
            category: entry.category,
            position: entry.position,
            riderName: entry.riderName,
            riderCountry: entry.riderCountry,
            team: entry.team,
            totalPoints: entry.totalPoints,
            eventsCount: entry.eventsCount,
            wins: entry.wins,
            podiums: entry.podiums,
          },
        });
        updated++;
      }

      championshipSet.add(championship);
    } catch (err) {
      errors.push(
        `[${championship}]: ${err instanceof Error ? err.message : "calc error"}`
      );
    }
  }

  return {
    updated,
    championships: championshipSet.size,
    errors,
  };
}

interface AggregatedEntry {
  category: string;
  riderName: string;
  riderCountry: string | null;
  team: string | null;
  totalPoints: number;
  eventsCount: number;
  wins: number;
  podiums: number;
  position: number;
}

function aggregateResults(
  results: Array<{
    category: string;
    position: number;
    riderName: string;
    riderCountry: string | null;
    team: string | null;
    points: number | null;
  }>
): AggregatedEntry[] {
  // Group by category
  const categories = new Map<string, Map<string, AggregatedEntry>>();

  for (const r of results) {
    if (!categories.has(r.category)) {
      categories.set(r.category, new Map());
    }
    const riders = categories.get(r.category)!;

    if (!riders.has(r.riderName)) {
      riders.set(r.riderName, {
        category: r.category,
        riderName: r.riderName,
        riderCountry: r.riderCountry,
        team: r.team,
        totalPoints: 0,
        eventsCount: 0,
        wins: 0,
        podiums: 0,
        position: 0,
      });
    }

    const entry = riders.get(r.riderName)!;
    entry.totalPoints += r.points ?? 0;
    entry.eventsCount += 1;
    if (r.position === 1) entry.wins += 1;
    if (r.position <= 3) entry.podiums += 1;
    // Keep latest country/team
    if (r.riderCountry) entry.riderCountry = r.riderCountry;
    if (r.team) entry.team = r.team;
  }

  // Sort each category and assign positions
  const all: AggregatedEntry[] = [];

  for (const riders of categories.values()) {
    const sorted = [...riders.values()].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.podiums - a.podiums;
    });

    sorted.forEach((entry, i) => {
      entry.position = i + 1;
    });

    all.push(...sorted);
  }

  return all;
}
