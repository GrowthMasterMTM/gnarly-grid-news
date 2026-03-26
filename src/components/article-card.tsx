import Link from "next/link";
import Image from "next/image";
import { formatRelative } from "@/lib/dates";

interface ArticleCardProps {
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  sport: string;
  source: {
    name: string;
    isOfficial: boolean;
  };
  groupSourceCount?: number;
}

export function ArticleCard({
  title,
  slug,
  summary,
  imageUrl,
  publishedAt,
  sport,
  source,
  groupSourceCount,
}: ArticleCardProps) {
  const hasMultipleSources = groupSourceCount !== undefined && groupSourceCount > 1;

  return (
    <Link
      href={`/story/${slug}`}
      className="group flex gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700"
    >
      {imageUrl ? (
        <div className="relative hidden h-24 w-36 flex-shrink-0 overflow-hidden rounded-md sm:block">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="144px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="hidden h-24 w-36 flex-shrink-0 items-center justify-center rounded-md bg-neutral-800 sm:flex">
          <span className="text-2xl text-neutral-600">
            {sport === "motocross" ? "MX" : sport === "enduro" ? "EN" : "GN"}
          </span>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="line-clamp-2 font-semibold text-white group-hover:text-neutral-200">
            {title}
          </h3>
          {summary && (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
              {summary}
            </p>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
          <span>{source.name}</span>
          {source.isOfficial && (
            <span className="rounded-full bg-green-900/30 px-1.5 py-0.5 text-green-400">
              Official
            </span>
          )}
          <span className="capitalize">{sport}</span>
          {publishedAt && <span>{formatRelative(publishedAt)}</span>}
          {hasMultipleSources && (
            <span className="rounded-full bg-blue-900/30 px-1.5 py-0.5 text-blue-400">
              {groupSourceCount} sources
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
