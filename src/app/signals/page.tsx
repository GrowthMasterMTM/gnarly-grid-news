import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/article-list";
import { StoryGroupCard } from "@/components/story-group-card";
import { buildMetadata } from "@/lib/seo";
import { getStoryGroups } from "@/server/queries";

export const metadata = buildMetadata({
  title: "Signals",
  description:
    "Multi-source motorsport stories — see what's happening now across Svemo, FIM, EnduroGP, and more.",
  path: "/signals",
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

interface SignalsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function SignalsPage({ searchParams }: SignalsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { groups, total } = await getStoryGroups({ limit: PAGE_SIZE, page });
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeading
        title="Signals"
        description="Stories covered by multiple sources — the high-signal overview of what's happening in motorsport."
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/news" className="text-neutral-400 hover:text-white">
          Full news feed &rarr;
        </Link>
        <Link href="/official" className="text-neutral-400 hover:text-white">
          Official updates &rarr;
        </Link>
        {total > 0 && (
          <span className="text-neutral-500">
            {total} multi-source stories
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
          No multi-source stories yet. Stories appear here when the same
          event is covered by multiple sources.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <StoryGroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        buildUrl={(p) => `/signals?page=${p}`}
      />
    </div>
  );
}
