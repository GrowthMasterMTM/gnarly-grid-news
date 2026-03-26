import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-6 border-b border-neutral-800 pb-4">
        <span className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Admin
        </span>
        {siteConfig.adminNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-neutral-400 transition-colors hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
