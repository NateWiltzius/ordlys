'use client';

import Link from 'next/link';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong | Ordlys</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          :root {
            color-scheme: light dark;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f8fafc;
            color: #111827;
          }
          * { box-sizing: border-box; }
          body { margin: 0; min-height: 100vh; background: inherit; color: inherit; }
          main { width: min(100% - 2rem, 36rem); margin: 0 auto; padding: 3rem 0; }
          .brand { color: inherit; font-size: 1.35rem; font-weight: 700; text-decoration: none; }
          .fallback { margin-top: 3rem; border-block: 1px solid #d1d5db; padding: 3rem 1rem; text-align: center; }
          .label { margin: 0; color: #6b7280; font-size: .75rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
          h1 { margin: .5rem 0 0; font-size: 1.5rem; line-height: 1.25; }
          .description { margin: .75rem auto 0; max-width: 30rem; color: #6b7280; line-height: 1.6; }
          .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; margin-top: 1.5rem; }
          button, .link {
            min-height: 2.5rem;
            border: 1px solid transparent;
            border-radius: .5rem;
            padding: .6rem 1rem;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
          }
          button { background: #2563eb; color: white; }
          .link { border-color: #d1d5db; color: inherit; text-decoration: none; }
          button:focus-visible, .link:focus-visible, .brand:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
          @media (max-width: 30rem) {
            main { padding-top: 1.5rem; }
            .fallback { margin-top: 2rem; }
            .actions { flex-direction: column; }
          }
          @media (prefers-color-scheme: dark) {
            :root { background: #09090b; color: #f4f4f5; }
            .fallback, .link { border-color: #3f3f46; }
            .label, .description { color: #a1a1aa; }
            button { background: #3b82f6; }
          }
        `}</style>
      </head>
      <body>
        <main>
          <Link className="brand" href="/">
            Ordlys
          </Link>
          <section className="fallback">
            <p className="label">Unexpected error</p>
            <h1>We couldn’t load Ordlys</h1>
            <p className="description">
              Try again. If the problem continues, return home and come back later.
            </p>
            <div className="actions">
              <button onClick={reset}>Try again</button>
              <Link className="link" href="/">
                Go home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
