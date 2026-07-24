'use client';

import { Button } from '@heroui/react';
import { useEffect } from 'react';
import ButtonLink from '@/components/shared/button-link';
import PageFallback from '@/components/shared/page-fallback';

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
    <PageFallback
      label="Unexpected error"
      title="Something went wrong"
      description="We couldn’t load this page. Try again, or return home and continue from there."
      actions={
        <>
          <Button onPress={reset} className="w-full sm:w-auto">
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary" className="w-full sm:w-auto">
            Go home
          </ButtonLink>
        </>
      }
    />
  );
}
