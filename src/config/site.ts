const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gnarlygrid.io";

export const siteConfig = {
  name: "Gnarly Grid",
  description:
    "Motorsport intelligence — motocross and enduro news, events, standings, and signals from official sources.",
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
