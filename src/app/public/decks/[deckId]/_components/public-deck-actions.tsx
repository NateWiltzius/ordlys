'use client';

import ButtonLink from '@/components/shared/button-link';
import { useAuthSessionState } from '@/hooks/use-auth-session-state';

type Props = {
  appDeckPath: string;
  placement: 'header' | 'footer';
};

export default function PublicDeckActions({ appDeckPath, placement }: Props) {
  const loggedIn = useAuthSessionState();
  const followDeckPath = `${appDeckPath}?follow=1`;

  if (placement === 'footer') {
    if (loggedIn === null) return null;
    if (loggedIn) return null;
    return (
      <section className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-8 text-center">
        <h2 className="text-2xl font-semibold">Ready to learn this deck?</h2>
        <p className="mx-auto mt-2 max-w-2xl text-default-600">
          Create an account to follow the deck, start learning, and keep your review schedule and
          progress in sync.
        </p>
        <ButtonLink
          href={`/auth/sign-up?next=${encodeURIComponent(followDeckPath)}`}
          size="lg"
          className="mt-5"
        >
          Create account to study
        </ButtonLink>
      </section>
    );
  }

  if (loggedIn === null) {
    return (
      <div className="h-11 w-full animate-pulse rounded-lg bg-default-200" aria-hidden="true" />
    );
  }

  if (loggedIn) {
    return (
      <ButtonLink href={appDeckPath} size="lg" className="w-full">
        Open in Ordlys
      </ButtonLink>
    );
  }

  const nextQuery = encodeURIComponent(followDeckPath);
  return (
    <>
      <ButtonLink href={`/auth/sign-up?next=${nextQuery}`} size="lg" className="w-full">
        Create account to study
      </ButtonLink>
      <ButtonLink href={`/auth/sign-in?next=${nextQuery}`} variant="secondary" className="w-full">
        Sign in
      </ButtonLink>
    </>
  );
}
