import Link from "next/link";
import Image from "next/image";
import { formatRelative } from "@/lib/dates";
import type { StoryGroupWithArticle } from "@/server/queries";

interface StoryGroupCardProps {
  group: StoryGroupWithArticle;
}

export function StoryGroupCard({ group }: StoryGroupCardProps) {
  const article = group.primaryArticle;
  const href = article ? `/story/${article.slug}` : "#";

  return (
    <Link
      href={href}
      className="group rounded-lg border border-neutral-800 bg-neutral-900 p-5 transition-colors hover:border-neutral-700"
    >
      <div className="flex gap-4">
        {article?.imageUrl && (
          <div className="relative hidden h-20 w-32 flex-shrink-0 overflow-hidden rounded-md sm:block">
            <Image
              src={article.imageUrl}
              alt={group.headline}
              fill
              sizes="128px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold text-white group-hover:text-neutral-200">
            {group.headline}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
            {group.summary}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
            <span className="rounded-full bg-blue-900/30 px-2 py-0.5 text-blue-400">
              {group.sourceCount} sources
            </span>
            {group.sport && (
              <span className="capitalize">{group.sport}</span>
            )}
            {group.latestPublishedAt && (
              <span>{formatRelative(group.latestPublishedAt)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
