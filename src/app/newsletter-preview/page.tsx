import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getExpandedDigest } from "@/server/digest";
import { exportDigest } from "@/server/export/digest-export";

export const metadata = buildMetadata({
  title: "Newsletter Preview",
  description: "Preview of the Gnarly Grid News digest newsletter.",
  path: "/newsletter-preview",
});

export const dynamic = "force-dynamic";

export default async function NewsletterPreviewPage() {
  const digest = await getExpandedDigest();
  const exported = exportDigest(digest, "Gnarly Grid News Digest");
  const isEmpty = exported.sections.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Newsletter Preview</h1>
        <div className="flex gap-3 text-xs">
          <Link
            href="/api/export/digest?format=html"
            className="rounded bg-neutral-800 px-3 py-1.5 text-neutral-300 hover:bg-neutral-700"
          >
            Export HTML
          </Link>
          <Link
            href="/api/export/digest?format=text"
            className="rounded bg-neutral-800 px-3 py-1.5 text-neutral-300 hover:bg-neutral-700"
          >
            Export Text
          </Link>
          <Link
            href="/api/export/digest"
            className="rounded bg-neutral-800 px-3 py-1.5 text-neutral-300 hover:bg-neutral-700"
          >
            Export JSON
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-8">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-white">
            {exported.siteName}
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            {exported.title} — {exported.dateLabel}
          </p>
        </div>

        {isEmpty ? (
          <p className="text-center text-neutral-500">
            No digest content yet. Articles will appear after sources are
            synced.
          </p>
        ) : (
          exported.sections.map((section) => (
            <div key={section.title} className="mb-8">
              <h3 className="mb-4 border-b border-neutral-800 pb-2 text-lg font-bold text-white">
                {section.title}
              </h3>

              {section.signals?.map((signal) => (
                <div key={signal.headline} className="mb-4">
                  <p className="font-semibold text-white">
                    {signal.primaryArticleSlug ? (
                      <Link
                        href={`/story/${signal.primaryArticleSlug}`}
                        className="hover:text-neutral-300"
                      >
                        {signal.headline}
                      </Link>
                    ) : (
                      signal.headline
                    )}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                    {signal.summary}
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    {signal.sourceCount} sources
                  </p>
                </div>
              ))}

              {section.articles?.map((article) => (
                <div key={article.slug} className="mb-4">
                  <p className="font-semibold text-white">
                    <Link
                      href={`/story/${article.slug}`}
                      className="hover:text-neutral-300"
                    >
                      {article.title}
                    </Link>
                  </p>
                  {article.summary && (
                    <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                      {article.summary}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-600">
                    {article.sourceName}
                    {article.isOfficial ? " (official)" : ""}
                  </p>
                </div>
              ))}
            </div>
          ))
        )}

        <div className="mt-8 border-t border-neutral-800 pt-4 text-center text-xs text-neutral-600">
          <Link href="/" className="hover:text-neutral-400">
            {exported.siteName}
          </Link>{" "}
          — Aggregated motorsport news
        </div>
      </div>
    </div>
  );
}
