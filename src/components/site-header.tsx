import Link from "next/link";
import { siteConfig } from "@/config/site";
import { LogoMark } from "@/components/logo-mark";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-12 items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-6 w-6" />
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold tracking-widest text-white">
                GNARLY
              </span>
              <span className="text-xs font-light tracking-widest text-blue-500">
                GRID
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-5">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-neutral-300 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex h-7 items-center gap-4 border-t border-neutral-800/50">
          {siteConfig.secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
