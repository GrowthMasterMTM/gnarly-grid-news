import { PageHeading } from "@/components/page-heading";
import { buildMetadata } from "@/lib/seo";
import { getSources } from "@/server/queries";
import { formatRelative } from "@/lib/dates";

export const metadata = buildMetadata({ title: "Admin — Sources" });
export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const sources = await getSources();

  return (
    <>
      <PageHeading
        title="Sources"
        description="All configured news sources."
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 text-neutral-500">
            <tr>
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Parser</th>
              <th className="pb-3 pr-4 font-medium">Region</th>
              <th className="pb-3 pr-4 font-medium">Sport</th>
              <th className="pb-3 pr-4 font-medium">Official</th>
              <th className="pb-3 pr-4 font-medium">Articles</th>
              <th className="pb-3 pr-4 font-medium">Last Sync</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {sources.map((source) => (
              <tr key={source.id}>
                <td className="py-3 pr-4 font-medium text-white">
                  {source.name}
                </td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-300">
                    {source.parserKey}
                  </code>
                </td>
                <td className="py-3 pr-4 text-neutral-400">{source.region}</td>
                <td className="py-3 pr-4 text-neutral-400">
                  {source.sportFocus}
                </td>
                <td className="py-3 pr-4">
                  {source.isOfficial ? (
                    <span className="text-green-400">Yes</span>
                  ) : (
                    <span className="text-neutral-600">No</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-neutral-400">
                  {source._count.articles}
                </td>
                <td className="py-3 pr-4 text-neutral-400">
                  {source.lastSyncedAt
                    ? formatRelative(source.lastSyncedAt)
                    : "Never"}
                </td>
                <td className="py-3">
                  {source.isActive ? (
                    <span className="rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">
                      Inactive
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
