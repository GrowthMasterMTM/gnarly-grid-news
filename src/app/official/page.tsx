import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { ArticleList, Pagination } from "@/components/article-list";
import { buildMetadata } from "@/lib/seo";
import { getArticles } from "@/server/queries";

export const metadata = buildMetadata({
  title: "Official Updates",
  description:
    "News from official motorsport federations — Svemo, FIM, EnduroGP. Trusted sources only.",
  path: "/official",
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface OfficialPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function OfficialPage({
  searchParams,
}: OfficialPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { articles, total, totalPages } = await getArticles({
    officialOnly: true,
    page,
    limit: PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading
        title="Official Updates"
        description="News from official motorsport federations and governing bodies. Trusted, verified sources only."
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link
          href="/sources"
          className="text-neutral-400 hover:text-white"
        >
          View all sources &rarr;
        </Link>
        <Link
          href="/federations"
          className="text-neutral-400 hover:text-white"
        >
          View federations &rarr;
        </Link>
        {total > 0 && (
          <span className="text-neutral-500">{total} articles</span>
        )}
      </div>

      <ArticleList
        articles={articles}
        emptyMessage="No official updates yet."
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        buildUrl={(p) => `/official?page=${p}`}
      />
    </div>
  );
}
