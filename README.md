# Ordlys

Ordlys is a spaced-repetition flashcard app for building vocabulary, learning new words, and reviewing them on schedule.

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
