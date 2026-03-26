import { z } from "zod/v4";

export const SportEnum = z.enum(["motocross", "enduro", "supermoto", "trial", "general"]);
export type Sport = z.infer<typeof SportEnum>;

export const RegionEnum = z.enum(["sweden", "europe", "usa", "global"]);
export type Region = z.infer<typeof RegionEnum>;

export const CategoryEnum = z.enum(["news", "results", "preview", "interview", "editorial", "regulation"]);
export type Category = z.infer<typeof CategoryEnum>;

export const NormalizedArticleSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  summary: z.string().nullable(),
  imageUrl: z.url().nullable(),
  publishedAt: z.iso.datetime().nullable(),
  sport: SportEnum,
  region: RegionEnum,
  category: CategoryEnum,
  sourceSlug: z.string().min(1),
  contentHash: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export type NormalizedArticle = z.infer<typeof NormalizedArticleSchema>;

export interface ArticleWithSource {
  id: string;
  title: string;
  slug: string;
  url: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  sport: string;
  region: string;
  category: string;
  source: {
    name: string;
    slug: string;
    logoUrl: string | null;
    isOfficial: boolean;
  };
}
