'use client';

import { Button } from '@heroui/react';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-default-500">
        We could not load this page. Your changes may not have been saved.
      </p>
      <Button className="mt-6" onPress={reset}>
        Try again
      </Button>
    </div>
  );
}
