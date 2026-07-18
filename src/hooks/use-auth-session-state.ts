'use client';

import { AuthSessionContext } from '@/components/providers/auth-session-provider';
import { useContext } from 'react';

export function useAuthSessionState(): boolean | null {
  const loggedIn = useContext(AuthSessionContext);

  if (loggedIn === undefined) {
    throw new Error('useAuthSessionState must be used within AuthSessionProvider.');
  }

  return loggedIn;
}
