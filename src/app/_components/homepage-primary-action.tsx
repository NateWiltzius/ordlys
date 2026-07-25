'use client';

import ButtonLink from '@/components/shared/button-link';
import { useAuthSessionState } from '@/hooks/use-auth-session-state';

export default function HomepagePrimaryAction() {
  const loggedIn = useAuthSessionState();

  if (loggedIn === null) {
    return (
      <span className="h-12 w-52 animate-pulse rounded-lg bg-default-200" aria-hidden="true" />
    );
  }

  return (
    <ButtonLink href={loggedIn ? '/dashboard' : '/auth/sign-up?next=%2Fdecks'} size="lg">
      {loggedIn ? 'Continue learning' : 'Create your first deck'}
    </ButtonLink>
  );
}
