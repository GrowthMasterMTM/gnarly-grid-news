import { z } from "zod/v4";
import { SportEnum, RegionEnum, CategoryEnum } from "./article";

export const ArticleFiltersSchema = z.object({
  sport: SportEnum.optional(),
  region: RegionEnum.optional(),
  category: CategoryEnum.optional(),
  sourceSlug: z.string().optional(),
  search: z.string().optional(),
  officialOnly: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ArticleFilters = z.infer<typeof ArticleFiltersSchema>;

export const SortOrder = z.enum(["newest", "oldest"]);
export type SortOrder = z.infer<typeof SortOrder>;
