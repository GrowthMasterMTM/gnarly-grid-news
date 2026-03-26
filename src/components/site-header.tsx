import Link from "next/link";
import { siteConfig } from "@/config/site";
import { LogoMark } from "@/components/logo-mark";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-widest text-white">
              GNARLY
            </span>
            <span className="text-sm font-light tracking-widest text-blue-500">
              GRID
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-neutral-400 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
