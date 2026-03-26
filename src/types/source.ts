import { z } from "zod/v4";
import { RegionEnum, SportEnum } from "./article";

export const SourceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  url: z.url(),
  feedUrl: z.url().nullable(),
  region: RegionEnum,
  sportFocus: SportEnum,
  parserKey: z.string().min(1),
  isOfficial: z.boolean(),
  pollingIntervalMinutes: z.int().min(1),
});

export type SourceConfig = z.infer<typeof SourceSchema>;

export interface SourceWithStats {
  id: string;
  name: string;
  slug: string;
  url: string;
  region: string;
  sportFocus: string;
  isOfficial: boolean;
  isActive: boolean;
  lastSyncedAt: Date | null;
  _count: {
    articles: number;
  };
}
