import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/news`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/mx`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/enduro`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/events`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/standings`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/signals`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${baseUrl}/digest`, changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/official`, changeFrequency: "hourly", priority: 0.6 },
    { url: `${baseUrl}/sources`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/federations`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/weekly`, changeFrequency: "weekly", priority: 0.5 },
  ];

  // All published articles
  const articles = await prisma.article.findMany({
    where: { isPublished: true, isDuplicate: false },
    select: { slug: true, publishedAt: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${baseUrl}/story/${a.slug}`,
    lastModified: a.updatedAt ?? a.publishedAt ?? undefined,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Events
  const events = await prisma.event.findMany({
    select: { slug: true, updatedAt: true },
  });

  const eventPages: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${baseUrl}/events/${e.slug}`,
    lastModified: e.updatedAt ?? undefined,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Sources
  const sources = await prisma.source.findMany({
    select: { slug: true },
  });

  const sourcePages: MetadataRoute.Sitemap = sources.map((s) => ({
    url: `${baseUrl}/sources/${s.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.3,
  }));

  return [...staticPages, ...articlePages, ...eventPages, ...sourcePages];
}
