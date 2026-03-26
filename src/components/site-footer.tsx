import { LogoMark } from "@/components/logo-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500">
        <div className="mb-3 flex items-center justify-center gap-2">
          <LogoMark className="h-5 w-5" />
          <span className="font-semibold tracking-wider text-neutral-400">
            GNARLY GRID
          </span>
        </div>
        <p>Motorsport intelligence — Motocross &amp; Enduro</p>
        <p className="mt-1 text-neutral-600">
          Sweden &middot; Europe &middot; Global
        </p>
      </div>
    </footer>
  );
}
