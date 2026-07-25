'use client';

import ButtonLink from '@/components/shared/button-link';
import { useAuthSessionState } from '@/hooks/use-auth-session-state';

export default function PublicDecksAccountAction() {
  const loggedIn = useAuthSessionState();

  if (loggedIn === null) {
    return <div className="h-8 w-32 animate-pulse rounded-lg bg-default-200" aria-hidden="true" />;
  }

  return loggedIn ? (
    <ButtonLink href="/decks" variant="tertiary" size="sm">
      Open your library
    </ButtonLink>
  ) : (
    <ButtonLink href="/auth/sign-up?next=%2Fdiscover" size="sm">
      Create an account
    </ButtonLink>
  );
}
