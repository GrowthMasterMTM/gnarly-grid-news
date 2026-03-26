import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedEvents = [
  {
    title: "EnduroGP Round 1 — GP of Italy",
    slug: "endurogp-2026-r1-italy",
    championship: "EnduroGP",
    discipline: "enduro",
    region: "europe",
    country: "Italy",
    venue: "Custonaci, Sicily",
    location: "Sicily, Italy",
    startDate: new Date("2026-04-10"),
    endDate: new Date("2026-04-12"),
    status: "upcoming",
    description:
      "The FIM EnduroGP World Championship returns to Sicily for Round 1 of the 2026 season.",
    eventUrl: "https://www.endurogp.com/r1-2026-gp-of-italy/",
  },
  {
    title: "EnduroGP Round 2 — GP of Spain",
    slug: "endurogp-2026-r2-spain",
    championship: "EnduroGP",
    discipline: "enduro",
    region: "europe",
    country: "Spain",
    venue: "Oliana",
    location: "Oliana, Spain",
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-05-03"),
    status: "upcoming",
    description:
      "Round 2 of the FIM EnduroGP World Championship heads to Oliana, Spain.",
  },
  {
    title: "EnduroGP Round 3 — GP of Finland",
    slug: "endurogp-2026-r3-finland",
    championship: "EnduroGP",
    discipline: "enduro",
    region: "europe",
    country: "Finland",
    venue: "Vierumäki",
    location: "Salpausselkä, Finland",
    startDate: new Date("2026-05-22"),
    endDate: new Date("2026-05-24"),
    status: "upcoming",
    description:
      "The EnduroGP World Championship visits Finland for Round 3.",
  },
  {
    title: "DEM Round 1 — Dahlen",
    slug: "dem-2026-r1-dahlen",
    championship: "DEM",
    discipline: "enduro",
    region: "europe",
    country: "Germany",
    venue: "Dahlen",
    location: "Sachsen, Germany",
    startDate: new Date("2026-03-22"),
    endDate: new Date("2026-03-22"),
    status: "completed",
    description:
      "Season opener of the Deutsche Enduro Meisterschaft 2026 in Dahlen.",
    eventUrl: "https://www.enduro-dm.de/de/termine/terminkalender",
  },
  {
    title: "DEM Round 2 — Meltewitz",
    slug: "dem-2026-r2-meltewitz",
    championship: "DEM",
    discipline: "enduro",
    region: "europe",
    country: "Germany",
    venue: "Meltewitz",
    location: "Sachsen, Germany",
    startDate: new Date("2026-05-09"),
    endDate: new Date("2026-05-10"),
    status: "upcoming",
    description:
      "DEM returns to Meltewitz after a four-year break for Round 2.",
  },
  {
    title: "SuperEnduro GP of Poland",
    slug: "superenduro-2025-gp-poland",
    championship: "SuperEnduro",
    discipline: "enduro",
    region: "europe",
    country: "Poland",
    venue: "Atlas Arena, Łódź",
    location: "Łódź, Poland",
    startDate: new Date("2025-12-14"),
    endDate: new Date("2025-12-14"),
    status: "completed",
    description:
      "Opening round of the 2025-2026 FIM SuperEnduro World Championship season.",
    eventUrl: "https://superenduro.org",
  },
  {
    title: "MXGP of Argentina",
    slug: "mxgp-2026-argentina",
    championship: "MXGP",
    discipline: "motocross",
    region: "global",
    country: "Argentina",
    venue: "Villa La Angostura",
    location: "Bariloche, Argentina",
    startDate: new Date("2026-03-08"),
    endDate: new Date("2026-03-09"),
    status: "completed",
    description: "MXGP and MX2 season opener in Argentina.",
  },
  {
    title: "Swedish Enduro Championship — Round 1",
    slug: "sem-2026-r1",
    championship: "SEM",
    discipline: "enduro",
    region: "sweden",
    country: "Sweden",
    venue: "TBD",
    location: "Sweden",
    startDate: new Date("2026-04-25"),
    endDate: new Date("2026-04-26"),
    status: "upcoming",
    description: "Opening round of the 2026 Swedish Enduro Championship.",
  },
];

async function main() {
  console.log("Seeding events...");

  for (const event of seedEvents) {
    const result = await prisma.event.upsert({
      where: { slug: event.slug },
      update: {
        title: event.title,
        championship: event.championship,
        discipline: event.discipline,
        region: event.region,
        country: event.country,
        venue: event.venue,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        description: event.description,
        eventUrl: event.eventUrl,
      },
      create: event,
    });
    console.log(`  Upserted event: ${result.title} (${result.slug})`);
  }

  console.log("Event seeding complete.");
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
