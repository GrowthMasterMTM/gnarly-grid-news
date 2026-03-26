import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 text-sm sm:grid-cols-4">
          <div>
            <h4 className="mb-3 font-semibold tracking-wider text-neutral-400">
              Sport
            </h4>
            <ul className="space-y-2 text-neutral-500">
              <li><Link href="/mx" className="hover:text-white">Motocross</Link></li>
              <li><Link href="/enduro" className="hover:text-white">Enduro</Link></li>
              <li><Link href="/news" className="hover:text-white">All News</Link></li>
              <li><Link href="/official" className="hover:text-white">Official</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold tracking-wider text-neutral-400">
              Intelligence
            </h4>
            <ul className="space-y-2 text-neutral-500">
              <li><Link href="/digest" className="hover:text-white">Digest</Link></li>
              <li><Link href="/signals" className="hover:text-white">Signals</Link></li>
              <li><Link href="/weekly" className="hover:text-white">Weekly</Link></li>
              <li><Link href="/newsletter-preview" className="hover:text-white">Newsletter</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold tracking-wider text-neutral-400">
              Racing
            </h4>
            <ul className="space-y-2 text-neutral-500">
              <li><Link href="/events" className="hover:text-white">Events</Link></li>
              <li><Link href="/standings" className="hover:text-white">Standings</Link></li>
              <li><Link href="/federations" className="hover:text-white">Federations</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold tracking-wider text-neutral-400">
              Sources
            </h4>
            <ul className="space-y-2 text-neutral-500">
              <li><Link href="/sources/svemo" className="hover:text-white">Svemo</Link></li>
              <li><Link href="/sources/fim-news" className="hover:text-white">FIM</Link></li>
              <li><Link href="/sources/endurogp" className="hover:text-white">EnduroGP</Link></li>
              <li><Link href="/sources" className="hover:text-white">All Sources</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 border-t border-neutral-800 pt-6 text-xs text-neutral-600">
          <LogoMark className="h-4 w-4" />
          <span>Gnarly Grid — Motorsport Intelligence</span>
        </div>
      </div>
    </footer>
  );
}
