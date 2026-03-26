import { PageHeading } from "@/components/page-heading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Admin — Sync Runs" });

export default function AdminSyncRunsPage() {
  return (
    <>
      <PageHeading
        title="Sync Runs"
        description="History of source synchronization runs."
      />
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
        Sync run history will be displayed here once syncing is implemented.
      </div>
    </>
  );
}
