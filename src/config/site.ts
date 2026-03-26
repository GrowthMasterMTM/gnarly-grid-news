const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gnarlygridnews.com";

export const siteConfig = {
  name: "Gnarly Grid News",
  description:
    "Aggregated motocross and enduro news from official federations and top sources across Sweden, Europe, and the US.",
  url: SITE_URL,
  locale: "en",
  sports: ["motocross", "enduro"] as const,
  regions: ["sweden", "europe", "usa", "global"] as const,
  nav: [
    { label: "Home", href: "/" },
    { label: "News", href: "/news" },
    { label: "MX", href: "/mx" },
    { label: "Enduro", href: "/enduro" },
    { label: "Events", href: "/events" },
    { label: "Standings", href: "/standings" },
  ],
  adminNav: [
    { label: "Dashboard", href: "/admin" },
    { label: "Sources", href: "/admin/sources" },
    { label: "Sync Runs", href: "/admin/sync-runs" },
    { label: "Newsletter", href: "/newsletter-preview" },
  ],
} as const;
