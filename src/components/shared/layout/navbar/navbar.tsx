import { createClient } from '@/lib/supabase/server';
import { Link as HeroLink } from '@heroui/react';
import Link from 'next/link';
import { Typography } from '@heroui/react';
import { signOutAction } from '@/server/auth.actions';

export default async function Navbar() {
  const supabase = await createClient();

  let loggedIn = false;

  try {
    const { data, error } = await supabase.auth.getClaims();

    if (!error) {
      loggedIn = !!data?.claims;
    }
  } catch {
    loggedIn = false;
  }

  return (
    <nav className="sticky top-0 z-50 flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-default-200 bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:flex-nowrap sm:py-4">
      <div className="shrink-0">
        <Link href={loggedIn ? '/dashboard' : '/'}>
          <Typography type="h1" className="text-2xl">
            Ordlys
          </Typography>
        </Link>
      </div>
      <div className="flex min-w-0 items-center gap-1 text-sm sm:gap-2 sm:text-base">
        {loggedIn ? (
          <>
            <HeroLink href="/dashboard" className="rounded-md px-2 py-2 text-primary sm:px-3">
              Dashboard
            </HeroLink>
            <HeroLink href="/decks" className="rounded-md px-2 py-2 text-primary sm:px-3">
              Decks
            </HeroLink>
            <form action={signOutAction} className="inline-flex">
              <button
                type="submit"
                className="link rounded-md bg-transparent px-2 py-2 text-primary sm:px-3"
              >
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <HeroLink href="/auth/sign-in" className="rounded-md px-2 py-2 text-primary sm:px-3">
              Sign In
            </HeroLink>
            <HeroLink href="/auth/sign-up" className="rounded-md px-2 py-2 text-primary sm:px-3">
              Sign Up
            </HeroLink>
          </>
        )}
      </div>
    </nav>
  );
}
