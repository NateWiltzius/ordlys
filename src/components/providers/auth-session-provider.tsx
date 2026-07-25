'use client';

import { createContext, type PropsWithChildren, useState } from 'react';

export const AuthSessionContext = createContext<boolean | null | undefined>(undefined);
export const AuthSessionUpdateContext = createContext<((loggedIn: boolean) => void) | undefined>(
  undefined,
);

type Props = PropsWithChildren<{
  initialLoggedIn: boolean;
}>;

export default function AuthSessionProvider({ children, initialLoggedIn }: Props) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);

  return (
    <AuthSessionContext value={loggedIn}>
      <AuthSessionUpdateContext value={setLoggedIn}>{children}</AuthSessionUpdateContext>
    </AuthSessionContext>
  );
}
