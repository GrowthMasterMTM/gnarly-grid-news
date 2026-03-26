/**
 * Rule-based result analysis engine.
 *
 * Generates deterministic insights from structured result data.
 * Designed to be enhanced by AI later — AI can rewrite summaries
 * while the rule engine provides the factual foundation.
 *
 * Insight types:
 * - event_winner: who won the event
 * - podium: top 3 finishers
 * - category_winner: winner per category
 * - national_highlight: notable national performance
 * - event_recap: overall event summary
 */

import { prisma } from "@/lib/db";

interface ResultRow {
  position: number;
  riderName: string;
  riderCountry: string | null;
  team: string | null;
  manufacturer: string | null;
  time: string | null;
  gap: string | null;
  points: number | null;
  category: string;
}

interface InsightData {
  insightType: string;
  headline: string;
  summary: string;
  dataJson: Record<string, unknown>;
}

export async function analyzeEventResults(eventId: string): Promise<{
  generated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let generated = 0;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!event) return { generated: 0, errors: ["Event not found"] };

  const results = await prisma.result.findMany({
    where: { eventId },
    orderBy: [{ category: "asc" }, { position: "asc" }],
  });

  if (results.length === 0) {
    return { generated: 0, errors: [] };
  }

  // Group by category
  const categories = new Map<string, ResultRow[]>();
  for (const r of results) {
    const cat = r.category;
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(r);
  }

  const insights: InsightData[] = [];

  // Generate insights per category
  for (const [category, rows] of categories) {
    const sorted = rows.sort((a, b) => a.position - b.position);

    // Event winner
    const winner = sorted[0];
    if (winner) {
      insights.push(generateWinnerInsight(winner, category, event.title));
    }

    // Podium (if 3+ results)
    if (sorted.length >= 3) {
      insights.push(generatePodiumInsight(sorted.slice(0, 3), category, event.title));
    }

    // National highlight (if country data exists)
    const withCountry = sorted.filter((r) => r.riderCountry);
    if (withCountry.length > 0) {
      const nationalInsight = generateNationalInsight(withCountry, category);
      if (nationalInsight) insights.push(nationalInsight);
    }
  }

  // Event recap (across all categories)
  if (categories.size > 0) {
    insights.push(
      generateEventRecap(categories, event.title, event.championship)
    );
  }

  // Store insights
  for (const insight of insights) {
    try {
      await prisma.resultInsight.upsert({
        where: {
          id: `${eventId}-${insight.insightType}-${insight.dataJson.category ?? "all"}`,
        },
        update: {
          headline: insight.headline,
          summary: insight.summary,
          dataJson: JSON.stringify(insight.dataJson),
        },
        create: {
          eventId,
          championship: event.championship,
          discipline: event.discipline,
          insightType: insight.insightType,
          headline: insight.headline,
          summary: insight.summary,
          dataJson: JSON.stringify(insight.dataJson),
          sourceScope: "event",
        },
      });
      generated++;
    } catch (err) {
      errors.push(
        `Failed to store ${insight.insightType}: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  }

  return { generated, errors };
}

function generateWinnerInsight(
  winner: ResultRow,
  category: string,
  eventTitle: string
): InsightData {
  const countryNote = winner.riderCountry
    ? ` (${winner.riderCountry})`
    : "";
  const teamNote = winner.team ? ` for ${winner.team}` : "";

  return {
    insightType: "event_winner",
    headline: `${winner.riderName} wins ${category} at ${eventTitle}`,
    summary: `${winner.riderName}${countryNote}${teamNote} took the ${category} victory${winner.time ? ` with a time of ${winner.time}` : ""}.`,
    dataJson: {
      category,
      riderName: winner.riderName,
      country: winner.riderCountry,
      team: winner.team,
      position: 1,
    },
  };
}

function generatePodiumInsight(
  podium: ResultRow[],
  category: string,
  eventTitle: string
): InsightData {
  const names = podium.map((r) => r.riderName);
  const podiumText = `1. ${names[0]}, 2. ${names[1]}, 3. ${names[2]}`;

  return {
    insightType: "podium",
    headline: `${category} podium: ${names.join(", ")}`,
    summary: `${eventTitle} ${category} podium: ${podiumText}.${podium[0].gap ? "" : ""}`,
    dataJson: {
      category,
      podium: podium.map((r) => ({
        position: r.position,
        riderName: r.riderName,
        country: r.riderCountry,
      })),
    },
  };
}

function generateNationalInsight(
  results: ResultRow[],
  category: string
): InsightData | null {
  // Find top Swedish rider if any (platform focus)
  const swedish = results.filter(
    (r) =>
      r.riderCountry?.toLowerCase() === "sweden" ||
      r.riderCountry?.toLowerCase() === "swe"
  );

  if (swedish.length > 0 && swedish[0].position <= 10) {
    const rider = swedish[0];
    return {
      insightType: "national_highlight",
      headline: `${rider.riderName} finishes P${rider.position} in ${category}`,
      summary: `Sweden's ${rider.riderName} finished in position ${rider.position} in the ${category} class.`,
      dataJson: {
        category,
        riderName: rider.riderName,
        country: "Sweden",
        position: rider.position,
      },
    };
  }

  return null;
}

function generateEventRecap(
  categories: Map<string, ResultRow[]>,
  eventTitle: string,
  championship: string
): InsightData {
  const categoryWinners: string[] = [];
  for (const [cat, rows] of categories) {
    if (rows.length > 0) {
      categoryWinners.push(`${rows[0].riderName} (${cat})`);
    }
  }

  const winnersText = categoryWinners.join(", ");

  return {
    insightType: "event_recap",
    headline: `${eventTitle} — Results`,
    summary: `${championship} results from ${eventTitle}. Winners: ${winnersText}.`,
    dataJson: {
      categoryCount: categories.size,
      totalResults: [...categories.values()].reduce(
        (sum, r) => sum + r.length,
        0
      ),
      winners: categoryWinners,
    },
  };
}
