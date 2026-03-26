import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500">
        <p>{siteConfig.name} — Aggregated motorsport news</p>
        <p className="mt-1">Motocross &amp; Enduro from Sweden, Europe, and the US</p>
      </div>
    </footer>
  );
}
