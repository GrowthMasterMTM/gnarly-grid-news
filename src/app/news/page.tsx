import { PageHeading } from "@/components/page-heading";
import { ArticleList, Pagination } from "@/components/article-list";
import { FilterBar } from "@/components/filter-bar";
import { buildMetadata } from "@/lib/seo";
import { getArticlesWithGroupCounts } from "@/server/queries";

export const metadata = buildMetadata({
  title: "News",
  description: "All motocross and enduro news from aggregated sources.",
  path: "/news",
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface NewsPageProps {
  searchParams: Promise<{
    page?: string;
    source?: string;
    sport?: string;
    region?: string;
    category?: string;
  }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const filters = {
    page,
    limit: PAGE_SIZE,
    sourceSlug: params.source || undefined,
    sport: validateEnum(params.sport, [
      "motocross",
      "enduro",
      "supermoto",
      "trial",
      "general",
    ]),
    region: validateEnum(params.region, [
      "sweden",
      "europe",
      "usa",
      "global",
    ]),
    category: validateEnum(params.category, [
      "news",
      "results",
      "preview",
      "interview",
      "editorial",
      "regulation",
    ]),
  };

  const { articles, total, totalPages } = await getArticlesWithGroupCounts(filters);

  const activeFilters = {
    sport: params.sport,
    region: params.region,
    source: params.source,
  };

  const hasFilters = Object.values(activeFilters).some(Boolean);

  function buildPageUrl(p: number): string {
    const parts = new URLSearchParams();
    parts.set("page", String(p));
    if (params.source) parts.set("source", params.source);
    if (params.sport) parts.set("sport", params.sport);
    if (params.region) parts.set("region", params.region);
    if (params.category) parts.set("category", params.category);
    return `/news?${parts.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading
        title="News"
        description={
          total > 0
            ? `${total} articles${hasFilters ? " matching filters" : " from all sources"}.`
            : "Latest motocross and enduro news."
        }
      />

      <FilterBar basePath="/news" currentFilters={activeFilters} />

      <ArticleList
        articles={articles}
        emptyMessage={
          hasFilters
            ? "No articles matching these filters."
            : "No articles yet. Run a sync to fetch news."
        }
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        buildUrl={buildPageUrl}
      />
    </div>
  );
}

function validateEnum<T extends string>(
  value: string | undefined,
  allowed: T[]
): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}
