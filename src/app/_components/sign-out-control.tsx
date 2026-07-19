'use client';

import { navigationItemClassName } from '@/app/_components/navigation-items';
import { clearPendingQuizAttempts } from '@/lib/quiz/pending-quiz-attempts';
import { signOutAction } from '@/server/auth.actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  variant: 'desktop' | 'mobile' | 'account';
  onSignedOut?: () => void;
};

export default function SignOutControl({ variant, onSignedOut }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSignOut = async () => {
    if (isPending) return;

    const root = document.documentElement;
    const activeTheme = root.classList.contains('dark') ? 'dark' : 'light';

    setIsPending(true);
    setHasError(false);
    try {
      localStorage.setItem('theme', activeTheme);
    } catch {
      // Theme persistence should never prevent the user from signing out.
    }

    try {
      await signOutAction();
      clearPendingQuizAttempts();
      root.classList.toggle('dark', activeTheme === 'dark');
      root.style.colorScheme = activeTheme;
      onSignedOut?.();
      router.replace('/');
      router.refresh();
    } catch {
      setHasError(true);
      setIsPending(false);
    }
  };

  const label = isPending ? 'Signing out…' : hasError ? 'Sign out failed - retry' : 'Sign out';

  if (variant === 'account') {
    return (
      <div className="space-y-2">
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60"
          disabled={isPending}
          onClick={() => void handleSignOut()}
        >
          {label}
        </button>
        {hasError ? (
          <p className="text-sm text-danger" role="alert">
            Sign out failed. Please try again.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${variant === 'mobile' ? 'w-full text-left' : ''} ${navigationItemClassName(
        variant,
      )} bg-transparent hover:cursor-pointer disabled:cursor-wait disabled:opacity-60`}
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
        void handleSignOut();
      }}
      disabled={isPending}
      aria-live="polite"
    >
      {label}
    </button>
  );
}
