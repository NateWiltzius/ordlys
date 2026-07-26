# Ordlys

Ordlys is a spaced-repetition flashcard app for building vocabulary, learning new words, and reviewing them on schedule.

## Product planning

The phased plan for focusing Ordlys commercially on Norwegian while preserving generic flashcards
is documented in [docs/norwegian-wedge-plan.md](docs/norwegian-wedge-plan.md).

## Feature flags

Norwegian wedge functionality is disabled by default and controlled by the server-side flags listed
in `.env.example`. Configure flags with the exact values `true` or `false`; ambiguous values fail
fast. Resolve flags through `src/config/feature-flags.ts` and pass individual booleans to client
components rather than reading environment variables in UI code.

## Local development

Requirements:

- Node.js 20 or newer
- PostgreSQL
- A Supabase project for authentication

Copy `.env.example` to `.env`, add your database and Supabase credentials, install dependencies,
and start the development server. Keep `SUPABASE_SECRET_KEY` server-only; it is required for
account deletion.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For production, set `NEXT_PUBLIC_SITE_URL` in Vercel to the canonical custom-domain origin (for
example, `https://www.example.com`). Ordlys uses it for canonical links, social previews,
`robots.txt`, and `sitemap.xml`.

## Release checklist

1. Apply every SQL file in `supabase/migrations` in order.
2. Configure the production operator name and public contact email from `.env.example`. Feedback is
   stored directly in the database.
3. In Supabase Auth, set the production Site URL and allowed redirect URLs. Decide whether sign-up
   requires email confirmation and configure custom SMTP before enabling password resets or
   confirmation mail for external users.

## Commands

```bash
npm run dev          # Start the development server
npm run build        # Create a production build
npm run start        # Run the production build
npm run lint         # Run ESLint
npm run drizzle-push # Push the Drizzle schema to the configured database
```

## Stack

- Next.js and React
- TypeScript and Tailwind CSS
- HeroUI
- Drizzle ORM and PostgreSQL
- Supabase authentication
