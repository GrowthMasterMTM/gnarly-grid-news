/**
 * Facebook content generator — creates posts from platform data.
 *
 * Post types:
 * - signal: multi-source story insight
 * - result: event winner / podium
 * - insight: standings/championship analysis
 * - event: upcoming event announcement
 * - article: latest news highlight
 */

import { siteConfig } from "@/config/site";
import { prisma, safeQuery } from "@/lib/db";

export interface SocialPost {
  type: "signal" | "result" | "insight" | "event" | "article";
  text: string;
  link: string | null;
}

export async function generateDailyPosts(
  count: number = 2
): Promise<SocialPost[]> {
  const posts: SocialPost[] = [];

  const generators = [
    generateSignalPost,
    generateResultPost,
    generateInsightPost,
    generateEventPost,
    generateArticlePost,
  ];

  for (const gen of generators) {
    if (posts.length >= count) break;
    try {
      const post = await gen();
      if (post) posts.push(post);
    } catch {
      // Skip failed generators
    }
  }

  return posts;
}

async function generateSignalPost(): Promise<SocialPost | null> {
  const groups = await safeQuery(() =>
    prisma.storyGroup.findMany({
      where: { sourceCount: { gte: 2 } },
      orderBy: { latestPublishedAt: "desc" },
      take: 1,
    })
  );

  if (!groups || groups.length === 0) return null;
  const g = groups[0];

  const text = [
    `📡 Signal\n`,
    g.headline,
    `\n${g.summary}`,
    `\n${g.sourceCount} sources tracking this story.`,
    `\nMore → ${siteConfig.url}/signals`,
  ].join("\n");

  return { type: "signal", text, link: `${siteConfig.url}/signals` };
}

async function generateResultPost(): Promise<SocialPost | null> {
  const insight = await safeQuery(() =>
    prisma.resultInsight.findFirst({
      where: { insightType: "event_winner", sourceScope: "event" },
      include: { event: { select: { slug: true, title: true } } },
      orderBy: { createdAt: "desc" },
    })
  );

  if (!insight) return null;

  const podium = await safeQuery(() =>
    prisma.resultInsight.findFirst({
      where: {
        insightType: "podium",
        eventId: insight.eventId,
      },
    })
  );

  let podiumText = "";
  if (podium?.dataJson) {
    try {
      const data = JSON.parse(podium.dataJson);
      if (data.podium) {
        podiumText = `\n\nTop 3:\n${data.podium.map((r: { position: number; riderName: string }) => `${r.position}. ${r.riderName}`).join("\n")}`;
      }
    } catch { /* skip */ }
  }

  const eventUrl = insight.event?.slug
    ? `${siteConfig.url}/events/${insight.event.slug}`
    : `${siteConfig.url}/standings`;

  const text = [
    `🏁 Result\n`,
    insight.headline,
    podiumText,
    `\nFull results → ${eventUrl}`,
  ].join("\n");

  return { type: "result", text, link: eventUrl };
}

async function generateInsightPost(): Promise<SocialPost | null> {
  const insight = await safeQuery(() =>
    prisma.resultInsight.findFirst({
      where: { sourceScope: "championship" },
      orderBy: { updatedAt: "desc" },
    })
  );

  if (!insight) return null;

  const text = [
    `💡 Insight\n`,
    insight.headline,
    `\n${insight.summary}`,
    `\nStandings → ${siteConfig.url}/standings`,
  ].join("\n");

  return { type: "insight", text, link: `${siteConfig.url}/standings` };
}

async function generateEventPost(): Promise<SocialPost | null> {
  const event = await safeQuery(() =>
    prisma.event.findFirst({
      where: { status: "upcoming", startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
    })
  );

  if (!event) return null;

  const dateStr = event.startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const text = [
    `📅 Next up\n`,
    event.title,
    `${dateStr}${event.location ? ` — ${event.location}` : ""}`,
    `\n${event.championship} · ${event.discipline}`,
    `\nWho takes it?`,
    `\nCalendar → ${siteConfig.url}/events`,
  ].join("\n");

  return { type: "event", text, link: `${siteConfig.url}/events/${event.slug}` };
}

async function generateArticlePost(): Promise<SocialPost | null> {
  const article = await safeQuery(() =>
    prisma.article.findFirst({
      where: { isPublished: true, isDuplicate: false },
      include: { source: { select: { name: true, isOfficial: true } } },
      orderBy: { publishedAt: "desc" },
    })
  );

  if (!article) return null;

  const officialTag = article.source.isOfficial ? " (Official)" : "";

  const text = [
    article.title,
    article.summary ? `\n${article.summary}` : "",
    `\n📰 ${article.source.name}${officialTag}`,
    `\nRead → ${siteConfig.url}/story/${article.slug}`,
  ].join("\n");

  return {
    type: "article",
    text,
    link: `${siteConfig.url}/story/${article.slug}`,
  };
}

/**
 * Generate the 5 launch posts for a new Facebook page.
 */
export async function generateLaunchPosts(): Promise<SocialPost[]> {
  const posts: SocialPost[] = [];

  // Post 1: Positioning
  posts.push({
    type: "article",
    text: [
      "Welcome to Gnarly Grid.\n",
      "We track what matters in motocross and enduro:",
      "→ Results",
      "→ Events",
      "→ Standings",
      "→ Signals\n",
      "Cut through the noise. See what matters.\n",
      `${siteConfig.url}`,
    ].join("\n"),
    link: siteConfig.url,
  });

  // Post 2-5: from real data
  const signal = await generateSignalPost();
  if (signal) posts.push(signal);

  const result = await generateResultPost();
  if (result) posts.push(result);

  const insight = await generateInsightPost();
  if (insight) posts.push(insight);

  const event = await generateEventPost();
  if (event) posts.push(event);

  return posts;
}
