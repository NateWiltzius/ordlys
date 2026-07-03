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
    <nav className="p-4 sticky top-0 w-full flex flex-row justify-between items-center border-b">
      <div>
        <Link href={loggedIn ? '/dashboard' : '/'}>
          <Typography type="h1" className="text-2xl">
            Ordlys
          </Typography>
        </Link>
      </div>
      <div className="flex gap-4">
        {loggedIn ? (
          <>
            <HeroLink href="/dashboard" className="text-primary">
              Dashboard
            </HeroLink>
            <HeroLink href="/decks" className="text-primary">
              Decks
            </HeroLink>
            <form action={signOutAction} className="inline-flex">
              <button type="submit" className="link text-primary bg-transparent p-0">
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <HeroLink href="/auth/sign-in" className="text-primary">
              Sign In
            </HeroLink>
            <HeroLink href="/auth/sign-up" className="text-primary">
              Sign Up
            </HeroLink>
          </>
        )}
      </div>
    </nav>
  );
}
