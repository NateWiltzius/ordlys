'use client';

import { createClient } from '@/lib/supabase/client';
import { createContext, type PropsWithChildren, useEffect, useState } from 'react';

export const AuthSessionContext = createContext<boolean | null | undefined>(undefined);

export default function AuthSessionProvider({ children }: PropsWithChildren) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let isActive = true;
    const supabase = createClient();

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (isActive) setLoggedIn(Boolean(data.session));
      })
      .catch(() => {
        if (isActive) setLoggedIn(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isActive) setLoggedIn(Boolean(session));
    });

    return () => {
      isActive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return <AuthSessionContext value={loggedIn}>{children}</AuthSessionContext>;
}
