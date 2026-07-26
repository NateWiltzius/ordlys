'use client';

import { createContext, type PropsWithChildren, useEffect, useState } from 'react';

export const AuthSessionContext = createContext<boolean | null | undefined>(undefined);
export const AuthSessionUpdateContext = createContext<((loggedIn: boolean) => void) | undefined>(
  undefined,
);

export default function AuthSessionProvider({ children }: PropsWithChildren) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function resolveSession() {
      try {
        const response = await fetch('/auth/session', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Unable to resolve session.');

        const session = (await response.json()) as { loggedIn?: unknown };
        setLoggedIn(session.loggedIn === true);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoggedIn(false);
      }
    }

    void resolveSession();
    return () => controller.abort();
  }, []);

  return (
    <AuthSessionContext value={loggedIn}>
      <AuthSessionUpdateContext value={setLoggedIn}>{children}</AuthSessionUpdateContext>
    </AuthSessionContext>
  );
}
