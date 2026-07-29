# Ordlys

Ordlys is a spaced-repetition flashcard app for building vocabulary, learning new words, and reviewing them on schedule.

## Local development

Requirements:

- Node.js 20 or newer
- PostgreSQL
- A Supabase project for authentication

Copy `.env.example` to `.env`, add your database and Supabase credentials, install dependencies,
and start the development server. Keep `SUPABASE_SECRET_KEY` server-only; it is required for
account deletion only.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For production, set `NEXT_PUBLIC_SITE_URL` in Vercel to the canonical custom-domain origin (for
example, `https://www.example.com`). Ordlys uses it for canonical links, social previews,
`robots.txt`, and `sitemap.xml`.

## Release checklist

1. Run `npm run drizzle-push`, then apply `supabase/migrations/0000_bootstrap.sql`.
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
npm run test         # Run unit tests
npm run check        # Run typecheck, lint, tests, and formatting checks
npm run test:db-contract # Run PostgreSQL contract tests against DATABASE_URL
npm run audit:prod   # Audit production dependencies
npm run drizzle-push # Push the Drizzle schema to the configured database
```

For a new database, push the Drizzle schema first. Then apply the single bootstrap SQL file:

```bash
npm run drizzle-push
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0000_bootstrap.sql
```

The bootstrap file installs RLS, browser-role restrictions, access helper functions, and immutable
release triggers. Historical data migrations are intentionally not part of fresh database setup.

Database contract tests are kept out of the normal local test suite. CI runs them explicitly against
its disposable PostgreSQL service; if you run them manually, they use `DATABASE_URL` and roll back
their test fixtures.

## Stack

- Next.js and React
- TypeScript and Tailwind CSS
- HeroUI
- Drizzle ORM and PostgreSQL
- Supabase authentication
