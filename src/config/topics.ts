import type { ArticleFilters } from "@/types/filters";

export interface TopicDefinition {
  slug: string;
  title: string;
  description: string;
  intro: string;
  filters: Partial<ArticleFilters>;
  seoDescription: string;
  relatedLinks: Array<{ label: string; href: string }>;
}

export const topics: TopicDefinition[] = [
  {
    slug: "enduro",
    title: "Enduro",
    description:
      "All enduro racing news — EnduroGP World Championship, national series, and federation updates.",
    intro:
      "Enduro is one of the most demanding disciplines in motorsport. Follow the latest from the FIM EnduroGP World Championship, national series across Europe and Sweden, and official federation updates.",
    filters: { sport: "enduro" },
    seoDescription:
      "Enduro racing news aggregated from EnduroGP, FIM, Svemo, and more.",
    relatedLinks: [
      { label: "EnduroGP source", href: "/sources/endurogp" },
      { label: "Enduro landing", href: "/enduro" },
      { label: "Enduro in news feed", href: "/news?sport=enduro" },
      { label: "Signals", href: "/signals" },
    ],
  },
  {
    slug: "motocross",
    title: "Motocross",
    description:
      "Motocross news from MXGP, MX2, national championships, and federation updates.",
    intro:
      "From MXGP and MX2 to Swedish national series and FIM regulations — follow motocross news from official sources and trusted coverage.",
    filters: { sport: "motocross" },
    seoDescription:
      "Motocross news aggregated from MXGP, FIM, Svemo, and more.",
    relatedLinks: [
      { label: "MX landing", href: "/mx" },
      { label: "MX in news feed", href: "/news?sport=motocross" },
      { label: "FIM topic", href: "/topics/fim" },
      { label: "Signals", href: "/signals" },
    ],
  },
  {
    slug: "fim",
    title: "FIM",
    description:
      "News from the Fédération Internationale de Motocyclisme — the governing body of world motorcycle sport.",
    intro:
      "The FIM governs motorcycle sport worldwide. Follow their latest regulations, championship updates, and official announcements across all disciplines.",
    filters: { sourceSlug: "fim-news" },
    seoDescription:
      "Latest FIM news — motorcycle racing governance, regulations, and championship updates.",
    relatedLinks: [
      { label: "FIM source", href: "/sources/fim-news" },
      { label: "Official updates", href: "/official" },
      { label: "Enduro topic", href: "/topics/enduro" },
      { label: "MX topic", href: "/topics/motocross" },
    ],
  },
  {
    slug: "svemo",
    title: "Svemo",
    description:
      "News from the Swedish Motorcycle and Snowmobile Federation — covering all disciplines in Sweden.",
    intro:
      "Svemo is the governing body for motorcycle and snowmobile sport in Sweden. Follow their news across enduro, motocross, trial, speedway, and more.",
    filters: { sourceSlug: "svemo" },
    seoDescription:
      "Swedish motorsport news from Svemo — motocross, enduro, trial, and more.",
    relatedLinks: [
      { label: "Svemo source", href: "/sources/svemo" },
      { label: "Sweden news", href: "/news?region=sweden" },
      { label: "Enduro topic", href: "/topics/enduro" },
      { label: "MX topic", href: "/topics/motocross" },
    ],
  },
  {
    slug: "endurogp",
    title: "EnduroGP",
    description:
      "Official news from the FIM EnduroGP World Championship — the pinnacle of enduro racing.",
    intro:
      "The FIM EnduroGP World Championship is the highest level of enduro competition. Follow race results, rider news, championship standings, and official announcements from the EnduroGP paddock.",
    filters: { sourceSlug: "endurogp" },
    seoDescription:
      "EnduroGP World Championship news — race results, rider updates, and championship standings.",
    relatedLinks: [
      { label: "EnduroGP source", href: "/sources/endurogp" },
      { label: "Enduro topic", href: "/topics/enduro" },
      { label: "FIM topic", href: "/topics/fim" },
      { label: "Signals", href: "/signals" },
    ],
  },
  {
    slug: "superenduro",
    title: "SuperEnduro",
    description:
      "Official news from the FIM SuperEnduro World Championship — indoor enduro at its most intense.",
    intro:
      "The FIM SuperEnduro World Championship brings enduro racing indoors with spectacular arena events across Europe. Follow race results, rider news, and championship updates.",
    filters: { sourceSlug: "superenduro" },
    seoDescription:
      "FIM SuperEnduro World Championship news — indoor enduro race results and championship coverage.",
    relatedLinks: [
      { label: "SuperEnduro source", href: "/sources/superenduro" },
      { label: "Enduro topic", href: "/topics/enduro" },
      { label: "EnduroGP topic", href: "/topics/endurogp" },
      { label: "Signals", href: "/signals" },
    ],
  },
];

export function getTopicBySlug(slug: string): TopicDefinition | undefined {
  return topics.find((t) => t.slug === slug);
}
