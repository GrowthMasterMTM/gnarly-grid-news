# Gnarly Grid News

Motorsport news aggregation platform — motocross and enduro.

## Stack

- Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS
- Prisma 6 + PostgreSQL
- Zod for validation
- Deployed on Vercel (serverless)

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run db:generate` — generate Prisma client
- `npm run db:migrate` — run migrations
- `npm run db:push` — push schema
- `npm run db:seed` — seed sources

## Architecture

- `src/app/` — App Router pages (all server components by default)
- `src/components/` — shared UI components
- `src/lib/` — utilities (db, slug, hash, dates, seo)
- `src/server/` — server-side business logic (future)
- `src/types/` — Zod schemas and TypeScript types
- `src/config/` — site and source configuration
- `prisma/` — schema and seed

## Rules

- No `any` types
- No business logic in UI components
- No Edge runtime for DB operations
- Keep server/client boundary clean
- Use Zod schemas for all external data validation
