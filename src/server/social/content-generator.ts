/**
 * Facebook content generator — event-driven, viral racing tone.
 *
 * All posts are timed around races:
 *
 * PRE-RACE (7 → 1 days before):
 *   - Countdown hype, standings preview, related news
 *
 * RACE WEEKEND (race day ± 1):
 *   - Results, podium, winner reaction
 *
 * POST-RACE (1-3 days after):
 *   - Championship impact, recap, article highlights
 *
 * QUIET PERIOD (no race within 7 days):
 *   - Only post if there's genuine breaking news
 *
 * 4 posts/day max, 2 per slot (EU morning + US morning).
 * Every post has an image. Link in auto-comment only.
 * Never repeat stale content.
 */

import { siteConfig } from "@/config/site";
import { prisma, safeQuery } from "@/lib/db";

// ─── Fallback images ────────────────────────────────────────────────

const FALLBACK_IMAGES = {
  motocross: `${siteConfig.url}/images/social/mx-fallback.jpg`,
  enduro: `${siteConfig.url}/images/social/enduro-fallback.jpg`,
  general: `${siteConfig.url}/images/social/grid-fallback.jpg`,
} as const;

// ─── Types ──────────────────────────────────────────────────────────

export interface SocialPost {
  type: "hype" | "countdown" | "standings_preview" | "result" | "podium" | "championship_impact" | "recap" | "article" | "welcome";
  text: string;
  link: string | null;
  imageUrl: string;
  /** Source credit for the image (e.g. "MXGP.com"). Null if using own image. */
  photoCredit: string | null;
}

type Slot = "eu_morning" | "us_morning";

type RacePhase = "pre_race" | "race_weekend" | "post_race" | "quiet";

interface RaceContext {
  phase: RacePhase;
  daysUntil: number;    // negative = days since race ended
  event: EventData;
}

interface EventData {
  id: string;
  title: string;
  slug: string;
  championship: string;
  discipline: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  imageUrl: string | null;
}

// ─── Race phase detection ───────────────────────────────────────────

async function getRaceContext(): Promise<RaceContext | null> {
  const now = new Date();

  // Check for ongoing or just-completed race (race weekend: day before → 3 days after)
  const recentOrOngoing = await safeQuery(() =>
    prisma.event.findFirst({
      where: {

        startDate: {
          gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          lte: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { startDate: "asc" },
    })
  );

  if (recentOrOngoing) {
    const daysUntil = Math.ceil(
      (recentOrOngoing.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const phase: RacePhase =
      daysUntil > 0 ? "pre_race" :
      daysUntil >= -1 ? "race_weekend" :
      "post_race";

    return { phase, daysUntil, event: recentOrOngoing as EventData };
  }

  // Check for upcoming race (next 14 days)
  const upcoming = await safeQuery(() =>
    prisma.event.findFirst({
      where: {
        status: "upcoming",

        startDate: {
          gte: now,
          lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { startDate: "asc" },
    })
  );

  if (upcoming) {
    const daysUntil = Math.ceil(
      (upcoming.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { phase: "pre_race", daysUntil, event: upcoming as EventData };
  }

  // Check for recently completed (post-race recap window)
  const justCompleted = await safeQuery(() =>
    prisma.event.findFirst({
      where: {
        status: "completed",

        startDate: {
          gte: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { startDate: "desc" },
    })
  );

  if (justCompleted) {
    const daysUntil = Math.ceil(
      (justCompleted.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { phase: "post_race", daysUntil, event: justCompleted as EventData };
  }

  return null;
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Generate 2 posts for a given time slot based on race phase.
 */
export async function generateSlotPosts(slot: Slot): Promise<SocialPost[]> {
  const ctx = await getRaceContext();
  if (!ctx) {
    // Quiet period — post fresh news if available
    return getLatestNews(2);
  }

  const posts: SocialPost[] = [];
  const generators = getGeneratorsForPhase(ctx, slot);

  for (const gen of generators) {
    if (posts.length >= 2) break;
    try {
      const post = await gen(ctx);
      if (post) posts.push(post);
    } catch {
      // Skip failed generators
    }
  }

  return posts;
}

/**
 * Preview posts for both slots.
 */
export async function previewAllSlots(): Promise<{
  eu_morning: SocialPost[];
  us_morning: SocialPost[];
  raceContext: { phase: string; daysUntil: number; event: string } | null;
}> {
  const ctx = await getRaceContext();
  const [eu, us] = await Promise.all([
    generateSlotPosts("eu_morning"),
    generateSlotPosts("us_morning"),
  ]);

  return {
    eu_morning: eu,
    us_morning: us,
    raceContext: ctx
      ? { phase: ctx.phase, daysUntil: ctx.daysUntil, event: ctx.event.title }
      : null,
  };
}

/**
 * Legacy compat.
 */
export async function generateDailyPosts(count: number = 2): Promise<SocialPost[]> {
  const all = [
    ...(await generateSlotPosts("eu_morning")),
    ...(await generateSlotPosts("us_morning")),
  ];
  return all.slice(0, count);
}

/**
 * Launch posts (one-time).
 */
export async function generateLaunchPosts(): Promise<SocialPost[]> {
  const posts: SocialPost[] = [];

  posts.push({
    type: "welcome",
    text: [
      "Gnarly Grid is live. 🔥\n",
      "Your new home for motocross and enduro intel.",
      "Results. Standings. Events. Signals.\n",
      "No fluff. Just the grid.\n",
      "Drop a 🏁 if you're in.",
    ].join("\n"),
    link: siteConfig.url,
    imageUrl: FALLBACK_IMAGES.general,
    photoCredit: null,
  });

  const ctx = await getRaceContext();
  if (ctx) {
    const result = await genResult(ctx);
    if (result) posts.push(result);
    const standings = await genStandingsPreview(ctx);
    if (standings) posts.push(standings);
    const hype = await genCountdown(ctx);
    if (hype) posts.push(hype);
  }

  return posts;
}

// ─── Phase → generator mapping ──────────────────────────────────────

type Generator = (ctx: RaceContext) => Promise<SocialPost | null>;

function getGeneratorsForPhase(ctx: RaceContext, slot: Slot): Generator[] {
  // Every phase ends with genLatestArticle as fallback — there's always news to share
  switch (ctx.phase) {
    case "pre_race":
      return slot === "eu_morning"
        ? [genCountdown, genStandingsPreview, genPreRaceNews, genRivalryHype, genLatestArticle]
        : [genRivalryHype, genCountdown, genPreRaceNews, genPredictionPoll, genLatestArticle];

    case "race_weekend":
      return slot === "eu_morning"
        ? [genResult, genPodium, genRaceWeekendNews, genLatestArticle]
        : [genResult, genChampionshipImpact, genRaceWeekendNews, genLatestArticle];

    case "post_race":
      return slot === "eu_morning"
        ? [genResult, genChampionshipImpact, genPostRaceRecap, genLatestArticle]
        : [genPostRaceRecap, genChampionshipImpact, genLookAhead, genLatestArticle];

    default:
      return [genLatestArticle];
  }
}

// ─── PRE-RACE generators ────────────────────────────────────────────

async function genCountdown(ctx: RaceContext): Promise<SocialPost | null> {
  const { event, daysUntil } = ctx;
  if (daysUntil <= 0 || daysUntil > 14) return null;

  const img = resolveImage(event.imageUrl, event.discipline);

  const hooks: Record<string, string[]> = {
    "1": [
      `TOMORROW. 🔥\n\n${event.title} is HERE.`,
      `T-minus 24 hours. ${event.title} 🔥`,
    ],
    "2": [
      `2 days. The grid is set.\n\n${event.title} is almost here.`,
    ],
    "3": [
      `3 days out. ${event.title}.\n\nWho's ready? 🔥`,
    ],
    default: [
      `${daysUntil} days until ${event.title}. ⏳`,
      `Countdown: ${daysUntil} days to ${event.title}. 💨`,
    ],
  };

  const options = hooks[String(daysUntil)] ?? hooks.default;
  const hook = pickRandom(options);

  const text = [
    hook,
    "",
    `${event.championship} · ${event.discipline}`,
    event.location ? `📍 ${event.location}` : "",
    "",
    "Who's your pick? Drop a name 👇",
  ].filter(Boolean).join("\n");

  return {
    type: "countdown",
    text: withPhotoCredit(text, img.credit),
    link: `${siteConfig.url}/events/${event.slug}`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

async function genStandingsPreview(ctx: RaceContext): Promise<SocialPost | null> {
  const standings = await safeQuery(() =>
    prisma.standing.findMany({
      where: {
        championship: ctx.event.championship,
        season: new Date().getFullYear(),
      },
      orderBy: { position: "asc" },
      take: 5,
    })
  );

  if (!standings || standings.length < 3) return null;

  const top5 = standings.map(
    (s) => `${s.position}. ${s.riderName} — ${s.totalPoints} pts`
  ).join("\n");

  const leader = standings[0];
  const gap = standings[0].totalPoints - standings[1].totalPoints;

  const img = resolveImage(null, ctx.event.discipline);
  return {
    type: "standings_preview",
    text: [
      `${ctx.event.championship} STANDINGS heading into ${ctx.event.title} 📊\n`,
      top5,
      "",
      gap <= 10
        ? `Only ${gap} points between P1 and P2. This is TIGHT. 🔥`
        : `${leader.riderName} leads by ${gap} points. Can anyone close the gap?`,
      "",
      "Who finishes the season on top? 👇",
    ].join("\n"),
    link: `${siteConfig.url}/standings`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

async function genPreRaceNews(ctx: RaceContext): Promise<SocialPost | null> {
  const articles = await safeQuery(() =>
    prisma.article.findMany({
      where: {
        isPublished: true,
        isDuplicate: false,
        sport: ctx.event.discipline,
        publishedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      include: { source: { select: { name: true, isOfficial: true } } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    })
  );

  if (!articles || articles.length === 0) return null;

  const top = articles[0];
  const img = resolveImage(
    top.source.isOfficial ? top.imageUrl : null,
    top.sport
  );

  const text = [
    `Pre-race intel 📰\n`,
    `New from ${top.source.name} ahead of ${ctx.event.title}.`,
    "",
    `${ctx.daysUntil} days to go.`,
    "",
    "Link in the comments 👇",
  ].join("\n");

  return {
    type: "article",
    text: withPhotoCredit(text, img.credit),
    link: `${siteConfig.url}/story/${top.slug}`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

async function genRivalryHype(ctx: RaceContext): Promise<SocialPost | null> {
  const standings = await safeQuery(() =>
    prisma.standing.findMany({
      where: {
        championship: ctx.event.championship,
        season: new Date().getFullYear(),
      },
      orderBy: { position: "asc" },
      take: 3,
    })
  );

  if (!standings || standings.length < 2) return null;

  const [p1, p2] = standings;
  const gap = p1.totalPoints - p2.totalPoints;
  const img = resolveImage(null, ctx.event.discipline);

  return {
    type: "hype",
    text: [
      `${p1.riderName} vs ${p2.riderName}. ${gap} points.\n`,
      `${ctx.event.title} could change everything. 🔥`,
      "",
      `${p1.riderName} — ${p1.totalPoints} pts`,
      `${p2.riderName} — ${p2.totalPoints} pts`,
      "",
      `Who takes it at ${ctx.event.location ?? ctx.event.title}? 👇`,
    ].join("\n"),
    link: `${siteConfig.url}/standings`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

async function genPredictionPoll(ctx: RaceContext): Promise<SocialPost | null> {
  const standings = await safeQuery(() =>
    prisma.standing.findMany({
      where: {
        championship: ctx.event.championship,
        season: new Date().getFullYear(),
      },
      orderBy: { position: "asc" },
      take: 5,
    })
  );

  if (!standings || standings.length < 3) return null;

  const names = standings.slice(0, 4).map((s) => s.riderName);

  const img = resolveImage(ctx.event.imageUrl, ctx.event.discipline);
  return {
    type: "hype",
    text: withPhotoCredit([
      `PREDICTION TIME 🔮\n`,
      `${ctx.event.title} — who wins?\n`,
      ...names.map((n) => `🏁 ${n}`),
      "",
      "Or someone else? Comment your pick 👇",
    ].join("\n"), img.credit),
    link: `${siteConfig.url}/events/${ctx.event.slug}`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

// ─── RACE WEEKEND generators ────────────────────────────────────────

async function genResult(ctx: RaceContext): Promise<SocialPost | null> {
  const insight = await safeQuery(() =>
    prisma.resultInsight.findFirst({
      where: { insightType: "event_winner", eventId: ctx.event.id },
      include: {
        event: { select: { slug: true, imageUrl: true, discipline: true } },
      },
    })
  );

  if (!insight) return null;

  const img = resolveImage(
    insight.event?.imageUrl ?? ctx.event.imageUrl,
    ctx.event.discipline
  );

  // insight.headline is our own generated text, not copied
  const text = [
    `RACE RESULT 🏁\n`,
    insight.headline,
    "",
    "Did you call it? 👇",
  ].join("\n");

  return {
    type: "result",
    text: withPhotoCredit(text, img.credit),
    link: `${siteConfig.url}/events/${ctx.event.slug}`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

async function genPodium(ctx: RaceContext): Promise<SocialPost | null> {
  const podium = await safeQuery(() =>
    prisma.resultInsight.findFirst({
      where: { insightType: "podium", eventId: ctx.event.id },
    })
  );

  if (!podium?.dataJson) return null;

  let podiumText = "";
  try {
    const data = JSON.parse(podium.dataJson);
    if (data.podium) {
      podiumText = data.podium
        .map(
          (r: { position: number; riderName: string }) =>
            `${r.position === 1 ? "🥇" : r.position === 2 ? "🥈" : "🥉"} ${r.riderName}`
        )
        .join("\n");
    }
  } catch {
    return null;
  }

  if (!podiumText) return null;

  const img = resolveImage(ctx.event.imageUrl, ctx.event.discipline);
  const text = [
    `PODIUM — ${ctx.event.title} 🏆\n`,
    podiumText,
    "",
    "Fair result? Or robbery? 👇",
  ].join("\n");

  return {
    type: "podium",
    text: withPhotoCredit(text, img.credit),
    link: `${siteConfig.url}/events/${ctx.event.slug}`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

async function genRaceWeekendNews(ctx: RaceContext): Promise<SocialPost | null> {
  const article = await safeQuery(() =>
    prisma.article.findFirst({
      where: {
        isPublished: true,
        isDuplicate: false,
        publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: { source: { select: { name: true, isOfficial: true } } },
      orderBy: { publishedAt: "desc" },
    })
  );

  if (!article) return null;

  // Only use external images from official federation sources
  const img = resolveImage(
    article.source.isOfficial ? article.imageUrl : null,
    article.sport
  );

  const text = [
    `Fresh from ${article.source.name} during ${ctx.event.title} weekend 📰`,
    "",
    "Link in the comments 👇",
  ].join("\n");

  return {
    type: "article",
    text: withPhotoCredit(text, img.credit),
    link: `${siteConfig.url}/story/${article.slug}`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

// ─── POST-RACE generators ───────────────────────────────────────────

async function genChampionshipImpact(ctx: RaceContext): Promise<SocialPost | null> {
  const insight = await safeQuery(() =>
    prisma.resultInsight.findFirst({
      where: { sourceScope: "championship", championship: ctx.event.championship },
      orderBy: { updatedAt: "desc" },
    })
  );

  if (!insight) return null;

  const img = resolveImage(null, ctx.event.discipline);
  // insight.headline and insight.summary are our own generated text
  return {
    type: "championship_impact",
    text: [
      `CHAMPIONSHIP UPDATE after ${ctx.event.title} 📊\n`,
      insight.headline,
      "",
      insight.summary,
      "",
      "Title favorite right now? 👇",
    ].join("\n"),
    link: `${siteConfig.url}/standings`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

async function genPostRaceRecap(ctx: RaceContext): Promise<SocialPost | null> {
  const articles = await safeQuery(() =>
    prisma.article.findMany({
      where: {
        isPublished: true,
        isDuplicate: false,
        publishedAt: {
          gte: new Date(ctx.event.startDate.getTime() - 24 * 60 * 60 * 1000),
        },
      },
      include: { source: { select: { name: true, isOfficial: true } } },
      orderBy: { publishedAt: "desc" },
      take: 4,
    })
  );

  if (!articles || articles.length === 0) return null;

  const top = articles[0];
  const img = resolveImage(
    top.source.isOfficial ? top.imageUrl : null,
    top.sport
  );

  const sourceNames = [...new Set(articles.map((a) => a.source.name))];

  const text = [
    `${ctx.event.title} recap 🏁\n`,
    `${articles.length} stories from ${sourceNames.join(", ")}.`,
    "",
    "Full coverage on the grid.",
    "",
    "What was your highlight? 👇",
  ].join("\n");

  return {
    type: "recap",
    text: withPhotoCredit(text, img.credit),
    link: `${siteConfig.url}/news`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

async function genLookAhead(ctx: RaceContext): Promise<SocialPost | null> {
  const next = await safeQuery(() =>
    prisma.event.findFirst({
      where: {
        status: "upcoming",

        startDate: { gt: ctx.event.startDate },
      },
      orderBy: { startDate: "asc" },
    })
  );

  if (!next) return null;

  const daysUntil = Math.ceil(
    (next.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const img = resolveImage(next.imageUrl, next.discipline);
  const text = [
    `Next stop: ${next.title} 🏁\n`,
    `${daysUntil} days away.`,
    next.location ? `📍 ${next.location}` : "",
    `${next.championship} · ${next.discipline}`,
    "",
    "Who carries the momentum? 👇",
  ].filter(Boolean).join("\n");

  return {
    type: "hype",
    text: withPhotoCredit(text, img.credit),
    link: `${siteConfig.url}/events/${next.slug}`,
    imageUrl: img.url,
    photoCredit: img.credit,
  };
}

// ─── News generators (used in every phase as fallback) ──────────────

/**
 * Latest article — works as fallback in any phase.
 * Picks from the last 48h, any source.
 */
async function genLatestArticle(_ctx: RaceContext): Promise<SocialPost | null> {
  return (await getLatestNews(1))[0] ?? null;
}

/**
 * Get N latest news articles as social posts.
 * Used both as generator fallback and for quiet-period posting.
 */
async function getLatestNews(max: number): Promise<SocialPost[]> {
  const articles = await safeQuery(() =>
    prisma.article.findMany({
      where: {
        isPublished: true,
        isDuplicate: false,
        publishedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      include: { source: { select: { name: true, isOfficial: true } } },
      orderBy: { publishedAt: "desc" },
      take: max,
    })
  );

  if (!articles || articles.length === 0) return [];

  return articles.map((a) => {
    // Only use external images from official sources (federations publish PR material)
    const img = resolveImage(
      a.source.isOfficial ? a.imageUrl : null,
      a.sport
    );

    // Never copy article title or summary directly — write our own teaser
    const text = [
      `New on the grid from ${a.source.name} 📰`,
      "",
      "Full story in the comments 👇",
    ].join("\n");

    return {
      type: "article" as const,
      text: withPhotoCredit(text, img.credit),
      link: `${siteConfig.url}/story/${a.slug}`,
      imageUrl: img.url,
      photoCredit: img.credit,
    };
  });
}

// ─── Helpers ────────────────────────────────────────────────────────

interface ResolvedImage {
  url: string;
  credit: string | null;
}

/**
 * Resolve image URL + credit. External images get a domain credit.
 * Own fallback images get null credit.
 */
function resolveImage(url: string | null | undefined, sport: string): ResolvedImage {
  if (url) {
    return { url, credit: extractDomain(url) };
  }
  if (sport === "enduro") return { url: FALLBACK_IMAGES.enduro, credit: null };
  if (sport === "motocross") return { url: FALLBACK_IMAGES.motocross, credit: null };
  return { url: FALLBACK_IMAGES.general, credit: null };
}

/**
 * Extract readable domain name from URL for photo credit.
 * "https://www.mxgp.com/path/img.jpg" → "mxgp.com"
 */
function extractDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    // Don't credit our own domain
    if (host === "gnarlygrid.io") return null;
    return host;
  } catch {
    return null;
  }
}

/**
 * Append photo credit to post text if image is from external source.
 */
function withPhotoCredit(text: string, credit: string | null): string {
  if (!credit) return text;
  return `${text}\n\n📸 ${credit}`;
}

function viralHook(title: string, sport: string): string {
  const sportEmoji = sport === "enduro" ? "🌲" : "🏁";
  if (title.length < 50) return `${title} ${sportEmoji}`;
  const short = title.slice(0, 60).replace(/\s+\S*$/, "");
  return `${short}... ${sportEmoji}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
