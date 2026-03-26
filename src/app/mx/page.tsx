import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { ArticleList, Pagination } from "@/components/article-list";
import { buildMetadata } from "@/lib/seo";
import { getArticles } from "@/server/queries";

export const metadata = buildMetadata({
  title: "Motocross News",
  description:
    "Latest motocross news from MXGP, MX2, and official federations. Aggregated from Svemo, FIM, and more.",
  path: "/mx",
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface MxPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MxPage({ searchParams }: MxPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { articles, total, totalPages } = await getArticles({
    sport: "motocross",
    page,
    limit: PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading
        title="Motocross"
        description="News, results, and updates from the world of motocross — MXGP, MX2, and national championships."
      />

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/news?sport=motocross"
          className="text-sm text-neutral-400 hover:text-white"
        >
          View in news feed &rarr;
        </Link>
        {total > 0 && (
          <span className="text-sm text-neutral-500">
            {total} articles
          </span>
        )}
      </div>

      <ArticleList
        articles={articles}
        emptyMessage="No motocross articles yet."
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        buildUrl={(p) => `/mx?page=${p}`}
      />
    </div>
  );
}
