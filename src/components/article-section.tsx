import Link from "next/link";
import { ArticleList } from "@/components/article-list";

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
}

interface ArticleSectionProps {
  title: string;
  href: string;
  articles: ArticleData[];
  emptyMessage?: string;
}

export function ArticleSection({
  title,
  href,
  articles,
  emptyMessage,
}: ArticleSectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <Link
          href={href}
          className="text-sm text-neutral-400 hover:text-white"
        >
          View all &rarr;
        </Link>
      </div>
      <ArticleList
        articles={articles}
        emptyMessage={emptyMessage ?? `No ${title.toLowerCase()} yet.`}
      />
    </section>
  );
}
