'use client';

import {
  AuthSessionContext,
  AuthSessionUpdateContext,
} from '@/components/providers/auth-session-provider';
import { useContext } from 'react';

export function useAuthSessionState(): boolean {
  const loggedIn = useContext(AuthSessionContext);

  if (loggedIn === undefined) {
    throw new Error('useAuthSessionState must be used within AuthSessionProvider.');
  }

  return loggedIn;
}

export function useAuthSessionUpdate(): (loggedIn: boolean) => void {
  const updateLoggedIn = useContext(AuthSessionUpdateContext);

  if (updateLoggedIn === undefined) {
    throw new Error('useAuthSessionUpdate must be used within AuthSessionProvider.');
  }

  return updateLoggedIn;
}
