'use client';

import { navigationItemClassName } from '@/app/_components/navigation-items';
import { clearPendingQuizAttempts } from '@/lib/quiz/pending-quiz-attempts';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@heroui/react';
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
      const { error } = await createClient().auth.signOut();
      if (error) throw error;

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
        <Button type="button" variant="tertiary" isPending={isPending} onPress={handleSignOut}>
          {label}
        </Button>
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
