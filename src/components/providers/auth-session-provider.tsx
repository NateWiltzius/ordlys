'use client';

import { createContext, type PropsWithChildren, useEffect, useState } from 'react';

export const AuthSessionContext = createContext<boolean | null | undefined>(undefined);

export default function AuthSessionProvider({ children }: PropsWithChildren) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch('/auth/session', {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) throw new Error('Could not resolve the current session.');
        return (await response.json()) as { loggedIn: boolean };
      })
      .then(({ loggedIn: hasSession }) => {
        setLoggedIn(hasSession);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoggedIn(false);
      });

    return () => controller.abort();
  }, []);

  return <AuthSessionContext value={loggedIn}>{children}</AuthSessionContext>;
}
