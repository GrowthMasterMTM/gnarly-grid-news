/**
 * Championship standings-based insight generator.
 * Produces insights like leader changes, points gaps, and title race updates.
 */

import { prisma } from "@/lib/db";

export async function generateStandingsInsights(
  championship: string,
  season?: number
): Promise<{ generated: number; errors: string[] }> {
  const yr = season ?? new Date().getFullYear();
  const errors: string[] = [];
  let generated = 0;

  const categories = await prisma.standing.findMany({
    where: { championship, season: yr },
    select: { category: true },
    distinct: ["category"],
  });

  for (const { category } of categories) {
    const standings = await prisma.standing.findMany({
      where: { championship, season: yr, category },
      orderBy: { position: "asc" },
    });

    if (standings.length < 2) continue;

    const discipline = standings[0].discipline;
    const leader = standings[0];
    const second = standings[1];
    const third = standings[2];

    // Leader insight
    try {
      await prisma.resultInsight.upsert({
        where: {
          id: `standings-${championship}-${yr}-${category}-leader`,
        },
        update: {
          headline: `${leader.riderName} leads ${championship} ${category}`,
          summary: `${leader.riderName}${leader.riderCountry ? ` (${leader.riderCountry})` : ""} leads the ${championship} ${category} standings with ${leader.totalPoints} points after ${leader.eventsCount} events. ${second.riderName} is second with ${second.totalPoints} points (gap: ${leader.totalPoints - second.totalPoints}).`,
          dataJson: JSON.stringify({
            category,
            season: yr,
            leader: {
              name: leader.riderName,
              points: leader.totalPoints,
              wins: leader.wins,
            },
            second: {
              name: second.riderName,
              points: second.totalPoints,
            },
            gap: leader.totalPoints - second.totalPoints,
          }),
        },
        create: {
          id: `standings-${championship}-${yr}-${category}-leader`,
          championship,
          discipline,
          insightType: "leader",
          headline: `${leader.riderName} leads ${championship} ${category}`,
          summary: `${leader.riderName} leads with ${leader.totalPoints} points. ${second.riderName} is ${leader.totalPoints - second.totalPoints} points behind.`,
          dataJson: JSON.stringify({
            category,
            season: yr,
            leader: { name: leader.riderName, points: leader.totalPoints },
            second: { name: second.riderName, points: second.totalPoints },
            gap: leader.totalPoints - second.totalPoints,
          }),
          sourceScope: "championship",
        },
      });
      generated++;
    } catch (err) {
      errors.push(`leader insight: ${err instanceof Error ? err.message : "error"}`);
    }

    // Title race insight (if top 3 are close)
    if (third) {
      const topGap = leader.totalPoints - third.totalPoints;
      if (topGap <= 30 && leader.eventsCount >= 2) {
        try {
          await prisma.resultInsight.upsert({
            where: {
              id: `standings-${championship}-${yr}-${category}-title-race`,
            },
            update: {
              headline: `${championship} ${category} title race: ${topGap} points separate top 3`,
              summary: `Tight battle in ${championship} ${category}: ${leader.riderName} (${leader.totalPoints}pts), ${second.riderName} (${second.totalPoints}pts), ${third.riderName} (${third.totalPoints}pts).`,
              dataJson: JSON.stringify({
                category,
                topGap,
                top3: standings.slice(0, 3).map((s) => ({
                  name: s.riderName,
                  points: s.totalPoints,
                  position: s.position,
                })),
              }),
            },
            create: {
              id: `standings-${championship}-${yr}-${category}-title-race`,
              championship,
              discipline,
              insightType: "title_race",
              headline: `${championship} ${category}: ${topGap} points separate top 3`,
              summary: `Tight title race: ${leader.riderName}, ${second.riderName}, and ${third.riderName} within ${topGap} points.`,
              dataJson: JSON.stringify({
                category,
                topGap,
                top3: standings.slice(0, 3).map((s) => ({
                  name: s.riderName,
                  points: s.totalPoints,
                })),
              }),
              sourceScope: "championship",
            },
          });
          generated++;
        } catch (err) {
          errors.push(`title_race: ${err instanceof Error ? err.message : "error"}`);
        }
      }
    }
  }

  return { generated, errors };
}
