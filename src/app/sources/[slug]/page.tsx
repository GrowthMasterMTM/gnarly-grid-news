import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { ArticleList } from "@/components/article-list";
import { buildMetadata } from "@/lib/seo";
import { seedSources } from "@/config/sources";
import { getArticles, getSourceBySlug } from "@/server/queries";
import { formatRelative } from "@/lib/dates";

interface SourceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SourceDetailPageProps) {
  const { slug } = await params;
  const source = seedSources.find((s) => s.slug === slug);
  if (!source) return buildMetadata({ title: "Source Not Found" });

  return buildMetadata({
    title: `${source.name} — News Source`,
    description: `${source.description}. ${source.sportFocus} coverage from ${source.region}.`,
    path: `/sources/${slug}`,
  });
}

export function generateStaticParams() {
  return seedSources.map((s) => ({ slug: s.slug }));
}

export default async function SourceDetailPage({
  params,
}: SourceDetailPageProps) {
  const { slug } = await params;
  const config = seedSources.find((s) => s.slug === slug);

  if (!config) notFound();

  const [{ articles, total }, dbSource] = await Promise.all([
    getArticles({ sourceSlug: slug, page: 1, limit: 20 }),
    getSourceBySlug(slug),
  ]);

  const lastSynced = dbSource?.lastSyncedAt;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading title={config.name} description={config.description} />

      <div className="mb-8 flex flex-wrap gap-3">
        <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
          {config.region}
        </span>
        <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
          {config.sportFocus}
        </span>
        {config.isOfficial && (
          <span className="rounded-full bg-green-900/30 px-3 py-1 text-sm text-green-400">
            Official
          </span>
        )}
        {total > 0 && (
          <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
            {total} articles
          </span>
        )}
        {lastSynced && (
          <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
            Synced {formatRelative(lastSynced)}
          </span>
        )}
      </div>

      <div className="mb-6">
        <Link
          href={`/news?source=${slug}`}
          className="text-sm text-neutral-400 hover:text-white"
        >
          View all articles in news feed &rarr;
        </Link>
      </div>

      <ArticleList
        articles={articles}
        emptyMessage={`No articles from ${config.name} yet.`}
      />

      {total > 20 && (
        <div className="mt-6 text-center">
          <Link
            href={`/news?source=${slug}`}
            className="text-sm text-neutral-400 hover:text-white"
          >
            View all {total} articles &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
