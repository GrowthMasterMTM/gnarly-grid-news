/**
 * Event-driven posting schedule.
 *
 * Determines WHEN to post based on race calendar:
 *
 * POST DAYS relative to race start:
 *   Day -7:  First hype post (1 post, EU only)
 *   Day -3:  Countdown + standings (2 posts, EU + US)
 *   Day -1:  Race eve — full hype (4 posts, both slots)
 *   Day  0:  Race day (4 posts, both slots)
 *   Day +1:  Results + recap (4 posts, both slots)
 *   Day +2:  Championship impact (2 posts, EU + US)
 *
 * QUIET DAYS: No automatic posts unless breaking news.
 *
 * The cron runs daily at both EU and US times.
 * This module decides whether to actually generate posts.
 */

import { prisma, safeQuery } from "@/lib/db";

type Slot = "eu_morning" | "us_morning";

interface ScheduleDecision {
  shouldPost: boolean;
  maxPosts: number;
  reason: string;
  eventTitle: string | null;
  daysFromRace: number | null;
}

/**
 * Check if we should post for a given slot right now.
 */
export async function shouldPostNow(slot: Slot): Promise<ScheduleDecision> {
  const now = new Date();

  // Find the nearest major event (past or future, within window)
  const nearestEvent = await findNearestEvent(now);

  if (!nearestEvent) {
    // No event nearby — still post news if EU slot to keep the page alive
    return slot === "eu_morning"
      ? { shouldPost: true, maxPosts: 1, reason: "No event nearby — news only", eventTitle: null, daysFromRace: null }
      : { shouldPost: false, maxPosts: 0, reason: "No event nearby — EU covers news", eventTitle: null, daysFromRace: null };
  }

  const daysFromRace = Math.round(
    (now.getTime() - nearestEvent.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine posting rules based on days from race
  const rules = getPostingRules(daysFromRace, slot);

  return {
    ...rules,
    eventTitle: nearestEvent.title,
    daysFromRace,
  };
}

/**
 * Get the full posting schedule for the next 14 days.
 * Useful for previewing what will happen.
 */
export async function getUpcomingSchedule(): Promise<
  Array<{
    date: string;
    daysFromRace: number;
    event: string;
    eu_morning: { shouldPost: boolean; maxPosts: number };
    us_morning: { shouldPost: boolean; maxPosts: number };
  }>
> {
  const now = new Date();
  const schedule: Array<{
    date: string;
    daysFromRace: number;
    event: string;
    eu_morning: { shouldPost: boolean; maxPosts: number };
    us_morning: { shouldPost: boolean; maxPosts: number };
  }> = [];

  for (let i = 0; i < 14; i++) {
    const day = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const event = await findNearestEvent(day);

    if (!event) continue;

    const daysFromRace = Math.round(
      (day.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const eu = getPostingRules(daysFromRace, "eu_morning");
    const us = getPostingRules(daysFromRace, "us_morning");

    if (eu.shouldPost || us.shouldPost) {
      schedule.push({
        date: day.toISOString().split("T")[0],
        daysFromRace,
        event: event.title,
        eu_morning: { shouldPost: eu.shouldPost, maxPosts: eu.maxPosts },
        us_morning: { shouldPost: us.shouldPost, maxPosts: us.maxPosts },
      });
    }
  }

  return schedule;
}

// ─── Internal ───────────────────────────────────────────────────────

function getPostingRules(
  daysFromRace: number,
  slot: Slot
): { shouldPost: boolean; maxPosts: number; reason: string } {
  // Day -7: First awareness (EU only)
  if (daysFromRace === -7) {
    return slot === "eu_morning"
      ? { shouldPost: true, maxPosts: 1, reason: "Race week starts — first hype" }
      : { shouldPost: false, maxPosts: 0, reason: "Day -7: EU only" };
  }

  // Day -5: Mid-week check-in
  if (daysFromRace === -5) {
    return slot === "eu_morning"
      ? { shouldPost: true, maxPosts: 1, reason: "Mid-week countdown" }
      : { shouldPost: true, maxPosts: 1, reason: "Mid-week US hype" };
  }

  // Day -3: Standings + countdown
  if (daysFromRace === -3) {
    return { shouldPost: true, maxPosts: 2, reason: "3 days out — standings + countdown" };
  }

  // Day -1: Race eve — full send
  if (daysFromRace === -1) {
    return { shouldPost: true, maxPosts: 2, reason: "Race eve — full hype" };
  }

  // Day 0: Race day
  if (daysFromRace === 0) {
    return { shouldPost: true, maxPosts: 2, reason: "RACE DAY" };
  }

  // Day +1: Results day
  if (daysFromRace === 1) {
    return { shouldPost: true, maxPosts: 2, reason: "Results + recap" };
  }

  // Day +2: Championship impact
  if (daysFromRace === 2) {
    return slot === "eu_morning"
      ? { shouldPost: true, maxPosts: 2, reason: "Championship impact + look ahead" }
      : { shouldPost: true, maxPosts: 1, reason: "US championship recap" };
  }

  // Other days: allow 1 news post per slot to keep the page alive
  return slot === "eu_morning"
    ? { shouldPost: true, maxPosts: 1, reason: "Off-day — news only" }
    : { shouldPost: false, maxPosts: 0, reason: "Off-day — EU slot covers news" };
}

async function findNearestEvent(
  referenceDate: Date
): Promise<{ title: string; startDate: Date; slug: string } | null> {
  // Post-race window: only look 3 days back (for recap posts)
  const windowStart = new Date(referenceDate.getTime() - 3 * 24 * 60 * 60 * 1000);
  // Pre-race window: look 10 days forward
  const windowEnd = new Date(referenceDate.getTime() + 10 * 24 * 60 * 60 * 1000);

  const events = await safeQuery(() =>
    prisma.event.findMany({
      where: {
        startDate: { gte: windowStart, lte: windowEnd },
      },
      orderBy: { startDate: "asc" },
      select: { title: true, startDate: true, slug: true },
    })
  );

  if (!events || events.length === 0) return null;

  // Prefer upcoming events over past ones
  const upcoming = events.filter((e) => e.startDate >= referenceDate);
  if (upcoming.length > 0) return upcoming[0];

  // Fall back to most recent past event (for post-race recap)
  return events[events.length - 1];
}
