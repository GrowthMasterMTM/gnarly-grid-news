import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { ArticleList, Pagination } from "@/components/article-list";
import { buildMetadata } from "@/lib/seo";
import { getArticles } from "@/server/queries";

export const metadata = buildMetadata({
  title: "Enduro News",
  description:
    "Latest enduro news from EnduroGP, SuperEnduro, DEM, and official federations. Aggregated from multiple sources.",
  path: "/enduro",
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface EnduroPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function EnduroPage({ searchParams }: EnduroPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { articles, total, totalPages } = await getArticles({
    sport: "enduro",
    page,
    limit: PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading
        title="Enduro"
        description="News, results, and updates from enduro racing worldwide — EnduroGP, Hard Enduro, and national series."
      />

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/news?sport=enduro"
          className="text-sm text-neutral-400 hover:text-white"
        >
          View in news feed &rarr;
        </Link>
        <Link
          href="/topics/endurogp"
          className="text-sm text-neutral-400 hover:text-white"
        >
          EnduroGP topic &rarr;
        </Link>
        {total > 0 && (
          <span className="text-sm text-neutral-500">
            {total} articles
          </span>
        )}
      </div>

      <ArticleList
        articles={articles}
        emptyMessage="No enduro articles yet."
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        buildUrl={(p) => `/enduro?page=${p}`}
      />
    </div>
  );
}
