import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Source config is defined inline here rather than importing from src/config/sources.ts
// because the seed script runs via tsx outside the Next.js build context,
// where the @/* path alias is not available.
const seedSources = [
  {
    name: "Svemo",
    slug: "svemo",
    url: "https://www.svemo.se",
    feedUrl: null,
    region: "sweden",
    sportFocus: "general",
    parserKey: "svemo",
    isOfficial: true,
    pollingIntervalMinutes: 60,
  },
  {
    name: "FIM News",
    slug: "fim-news",
    url: "https://www.fim-moto.com",
    feedUrl: null,
    region: "global",
    sportFocus: "general",
    parserKey: "fim-news",
    isOfficial: true,
    pollingIntervalMinutes: 120,
  },
  {
    name: "FIM Enduro",
    slug: "fim-enduro",
    url: "https://www.fim-moto.com/en/sport/enduro",
    feedUrl: null,
    region: "global",
    sportFocus: "enduro",
    parserKey: "fim-enduro",
    isOfficial: true,
    pollingIntervalMinutes: 120,
  },
  {
    name: "DEM",
    slug: "dem",
    url: "https://www.enduro-dm.de",
    feedUrl: null,
    region: "europe",
    sportFocus: "enduro",
    parserKey: "dem",
    isOfficial: false,
    pollingIntervalMinutes: 180,
  },
  {
    name: "EnduroGP",
    slug: "endurogp",
    url: "https://www.endurogp.com",
    feedUrl: null,
    region: "global",
    sportFocus: "enduro",
    parserKey: "endurogp",
    isOfficial: true,
    pollingIntervalMinutes: 120,
  },
  {
    name: "SuperEnduro",
    slug: "superenduro",
    url: "https://superenduro.org",
    feedUrl: null,
    region: "global",
    sportFocus: "enduro",
    parserKey: "superenduro",
    isOfficial: true,
    pollingIntervalMinutes: 180,
  },
];

async function main() {
  console.log("Seeding sources...");

  for (const source of seedSources) {
    const result = await prisma.source.upsert({
      where: { slug: source.slug },
      update: {
        name: source.name,
        url: source.url,
        feedUrl: source.feedUrl,
        region: source.region,
        sportFocus: source.sportFocus,
        parserKey: source.parserKey,
        isOfficial: source.isOfficial,
        pollingIntervalMinutes: source.pollingIntervalMinutes,
      },
      create: source,
    });
    console.log(`  Upserted source: ${result.name} (${result.slug})`);
  }

  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
