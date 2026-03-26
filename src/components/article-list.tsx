import Link from "next/link";
import { ArticleCard } from "@/components/article-card";

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  sport: string;
  source: {
    name: string;
    slug: string;
    isOfficial: boolean;
  };
  groupSourceCount?: number;
}

interface ArticleListProps {
  articles: ArticleData[];
  emptyMessage?: string;
}

export function ArticleList({
  articles,
  emptyMessage = "No articles yet.",
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          title={article.title}
          slug={article.slug}
          summary={article.summary}
          imageUrl={article.imageUrl}
          publishedAt={article.publishedAt}
          sport={article.sport}
          source={article.source}
          groupSourceCount={article.groupSourceCount}
        />
      ))}
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  buildUrl: (page: number) => string;
}

export function Pagination({ page, totalPages, buildUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-4">
      {page > 1 && (
        <Link
          href={buildUrl(page - 1)}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500 hover:text-white"
        >
          &larr; Previous
        </Link>
      )}
      <span className="text-sm text-neutral-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={buildUrl(page + 1)}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500 hover:text-white"
        >
          Next &rarr;
        </Link>
      )}
    </nav>
  );
}
