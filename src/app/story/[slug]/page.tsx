import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/dates";
import {
  getArticleBySlug,
  getRelatedArticles,
  getArticleGroup,
} from "@/server/queries";
import { ArticleList } from "@/components/article-list";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StoryPageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return buildMetadata({ title: "Article Not Found" });
  }

  return buildMetadata({
    title: article.title,
    description: article.summary ?? undefined,
    path: `/story/${slug}`,
    image: article.imageUrl ?? undefined,
    type: "article",
    publishedAt: article.publishedAt?.toISOString(),
  });
}

export const dynamic = "force-dynamic";

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const [groupArticles, related] = await Promise.all([
    article.duplicateGroupKey
      ? getArticleGroup(article.duplicateGroupKey, article.id)
      : Promise.resolve([]),
    getRelatedArticles(
      article.id,
      article.sport,
      article.sourceId,
      article.duplicateGroupKey
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <article>
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <Link
              href={`/sources/${article.source.slug}`}
              className="text-neutral-400 hover:text-white"
            >
              {article.source.name}
            </Link>
            {article.source.isOfficial && (
              <span className="rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                Official
              </span>
            )}
            <Link
              href={`/news?sport=${article.sport}`}
              className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs capitalize text-neutral-300 hover:bg-neutral-700"
            >
              {article.sport}
            </Link>
            {article.category !== "news" && (
              <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs capitalize text-neutral-300">
                {article.category}
              </span>
            )}
            {article.publishedAt && (
              <time
                dateTime={article.publishedAt.toISOString()}
                className="text-neutral-500"
              >
                {formatDate(article.publishedAt)}
              </time>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {article.title}
          </h1>
          {article.summary && (
            <p className="mt-3 text-lg text-neutral-400">{article.summary}</p>
          )}
        </header>

        {article.imageUrl && (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        )}

        {groupArticles.length > 0 && (
          <div className="mb-8 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <p className="mb-3 text-sm font-medium text-neutral-400">
              Also covered by {groupArticles.length} other{" "}
              {groupArticles.length === 1 ? "source" : "sources"}
            </p>
            <div className="flex flex-col gap-2">
              {groupArticles.map((ga) => (
                <div key={ga.id} className="flex items-center gap-3 text-sm">
                  <Link
                    href={`/story/${ga.slug}`}
                    className="text-neutral-300 hover:text-white"
                  >
                    {ga.source.name}
                  </Link>
                  {ga.source.isOfficial && (
                    <span className="rounded-full bg-green-900/30 px-1.5 py-0.5 text-xs text-green-400">
                      Official
                    </span>
                  )}
                  {ga.title !== article.title && (
                    <span className="truncate text-neutral-500">
                      {ga.title}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="prose-invert max-w-none">
          {article.contentHtml ? (
            <div
              className="space-y-4 leading-relaxed text-neutral-300 [&_a]:text-blue-400 [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_li]:ml-4 [&_ol]:list-decimal [&_p]:text-neutral-300 [&_strong]:text-white [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          ) : article.contentText ? (
            <div className="whitespace-pre-line leading-relaxed text-neutral-300">
              {article.contentText}
            </div>
          ) : (
            <p className="text-neutral-500">No content available.</p>
          )}
        </div>

        <footer className="mt-12 border-t border-neutral-800 pt-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white"
            >
              View original &rarr;
            </a>
            <Link
              href={`/sources/${article.source.slug}`}
              className="text-neutral-400 hover:text-white"
            >
              More from {article.source.name}
            </Link>
            <Link
              href={`/news?sport=${article.sport}`}
              className="text-neutral-400 hover:text-white"
            >
              More {article.sport}
            </Link>
            <Link href="/news" className="text-neutral-400 hover:text-white">
              All news
            </Link>
          </div>
        </footer>
      </article>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-xl font-bold text-white">
            Related Stories
          </h2>
          <ArticleList articles={related} />
        </section>
      )}
    </div>
  );
}
