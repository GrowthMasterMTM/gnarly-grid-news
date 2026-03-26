import Link from "next/link";
import { ArticleList } from "@/components/article-list";
import { StoryGroupCard } from "@/components/story-group-card";
import type { StoryGroupWithArticle } from "@/server/queries";

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  sport: string;
  source: { name: string; slug: string; isOfficial: boolean };
}

interface DigestSectionProps {
  title: string;
  href?: string;
  children: React.ReactNode;
}

export function DigestSection({ title, href, children }: DigestSectionProps) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {href && (
          <Link
            href={href}
            className="text-sm text-neutral-400 hover:text-white"
          >
            More &rarr;
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

interface SignalListProps {
  groups: StoryGroupWithArticle[];
  emptyMessage?: string;
}

export function SignalList({
  groups,
  emptyMessage = "No signals yet.",
}: SignalListProps) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-neutral-500">{emptyMessage}</p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <StoryGroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

interface DigestArticleListProps {
  articles: ArticleData[];
  emptyMessage?: string;
}

export function DigestArticleList({
  articles,
  emptyMessage = "No updates yet.",
}: DigestArticleListProps) {
  if (articles.length === 0) {
    return (
      <p className="text-sm text-neutral-500">{emptyMessage}</p>
    );
  }
  return <ArticleList articles={articles} />;
}
