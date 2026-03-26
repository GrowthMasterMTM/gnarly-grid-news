import { PageHeading } from "@/components/page-heading";
import { buildMetadata } from "@/lib/seo";
import { getAdminStats } from "@/server/queries";
import { getSummaryProviderStatus } from "@/server/groups/summary-service";
import { formatRelative } from "@/lib/dates";

export const metadata = buildMetadata({ title: "Admin Dashboard" });
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { sourceCount, articleCount, lastSync } = await getAdminStats();
  const summaryStatus = getSummaryProviderStatus();

  return (
    <>
      <PageHeading
        title="Admin Dashboard"
        description="Manage sources, sync runs, and monitor the platform."
      />
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Active Sources</p>
          <p className="mt-1 text-3xl font-bold text-white">{sourceCount}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Total Articles</p>
          <p className="mt-1 text-3xl font-bold text-white">{articleCount}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Last Sync</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {lastSync ? formatRelative(lastSync.startedAt) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Summary Provider</p>
          <p className="mt-1 text-lg font-bold text-white">
            {summaryStatus.provider}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {summaryStatus.configured ? "AI configured" : "Fallback mode"}
          </p>
        </div>
      </div>
    </>
  );
}
