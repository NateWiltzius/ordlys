'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            fontFamily: 'sans-serif',
            maxWidth: 600,
            margin: '80px auto',
            textAlign: 'center',
          }}
        >
          <h1>Ordlys hit an unexpected error</h1>
          <p>Please try again. If the problem continues, return later.</p>
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
