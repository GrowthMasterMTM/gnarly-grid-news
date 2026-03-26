import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { ArticleList, Pagination } from "@/components/article-list";
import { StoryGroupCard } from "@/components/story-group-card";
import { buildMetadata } from "@/lib/seo";
import { getArticles, getStoryGroups } from "@/server/queries";
import { topics, getTopicBySlug } from "@/config/topics";

interface TopicPageProps {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: TopicPageProps) {
  const { topic: slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return buildMetadata({ title: "Topic Not Found" });

  return buildMetadata({
    title: topic.title,
    description: topic.seoDescription,
    path: `/topics/${slug}`,
  });
}

export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.slug }));
}

const PAGE_SIZE = 20;

export default async function TopicPage({
  params,
  searchParams,
}: TopicPageProps) {
  const { topic: slug } = await params;
  const sp = await searchParams;
  const topic = getTopicBySlug(slug);

  if (!topic) notFound();

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sportFilter = topic.filters.sport;

  const [articles, grouped] = await Promise.all([
    getArticles({ ...topic.filters, page, limit: PAGE_SIZE }),
    page === 1 && sportFilter
      ? getStoryGroups({ sport: sportFilter, limit: 3 })
      : Promise.resolve({ groups: [], total: 0 }),
  ]);

  const { articles: articleList, total, totalPages } = articles;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading title={topic.title} description={topic.description} />

      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-neutral-400">
        {topic.intro}
      </p>

      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        {topic.relatedLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-neutral-400 hover:text-white"
          >
            {link.label} &rarr;
          </Link>
        ))}
        {total > 0 && (
          <span className="text-neutral-500">{total} articles</span>
        )}
      </div>

      {grouped.groups.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-white">Key Stories</h2>
          <div className="flex flex-col gap-3">
            {grouped.groups.map((group) => (
              <StoryGroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      {page === 1 && articleList.length > 0 && (
        <h2 className="mb-4 text-lg font-bold text-white">Latest Articles</h2>
      )}

      <ArticleList
        articles={articleList}
        emptyMessage={`No ${topic.title.toLowerCase()} articles yet.`}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        buildUrl={(p) => `/topics/${slug}?page=${p}`}
      />
    </div>
  );
}
