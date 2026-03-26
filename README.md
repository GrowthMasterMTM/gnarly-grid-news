# Gnarly Grid News

Aggregated motocross and enduro news platform. Normalizes articles from official federations and top sources across Sweden, Europe, and the US into a unified feed.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS**
- **Prisma ORM** + PostgreSQL
- **Zod** for schema validation
- Deployed on **Vercel**

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a remote instance)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and update the database URL:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gnarly_grid_news?schema=public"
```

### 3. Set up the database

Run Prisma migrations to create the database schema:

```bash
npm run db:migrate
```

Or push the schema directly (no migration files):

```bash
npm run db:push
```

### 4. Seed the database

```bash
npm run db:seed
```

This seeds the 6 configured sources: Svemo, FIM News, FIM Enduro, DEM, EnduroGP, and SuperEnduro.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/              # Next.js App Router pages
    admin/          # Admin dashboard, sources, sync-runs
    enduro/         # Enduro sport page
    federations/    # Federation listing
    mx/             # Motocross sport page
    news/           # All news feed
    sources/        # Source listing and detail pages
    story/          # Individual article pages
  components/       # Shared UI components
  config/           # Site and source configuration
  lib/              # Utility modules (db, slug, hash, dates, seo)
  server/           # Server-side logic (future phases)
  types/            # Zod schemas and TypeScript types
prisma/
  schema.prisma     # Database schema
  seed.ts           # Seed script
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (defaults to https://gnarlygridnews.com) | No |

## Sources

| Source | Region | Sport | Official |
|---|---|---|---|
| Svemo | Sweden | General | Yes |
| FIM News | Global | General | Yes |
| FIM Enduro | Global | Enduro | Yes |
| DEM | Europe | Enduro | No |
| EnduroGP | Global | Enduro | Yes |
| SuperEnduro | Global | Enduro | Yes |
