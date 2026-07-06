'use client';

import { Bars3Icon } from '@heroicons/react/24/outline';
import { Button, Popover } from '@heroui/react';
import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from '@/app/_components/theme-toggle';
import { signOutAction } from '@/server/auth.actions';
import { getNavigationItems } from '@/app/_components/navigation-items';

type Props = {
  loggedIn: boolean;
};

export default function MobileNavigation({ loggedIn }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const navigationItems = getNavigationItems(loggedIn);

  return (
    <div className="flex items-center gap-1 sm:hidden">
      <ThemeToggle />
      <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button
          type="button"
          size="sm"
          variant="tertiary"
          isIconOnly
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
        >
          <Bars3Icon className="h-5 w-5" aria-hidden="true" />
        </Button>
        <Popover.Content placement="bottom end">
          <Popover.Dialog aria-label="Navigation menu" className="w-44 p-1">
            <div className="flex flex-col">
              {navigationItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-default-100"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {loggedIn && (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-transparent px-3 py-2 text-left text-sm text-foreground hover:bg-default-100"
                  >
                    Sign Out
                  </button>
                </form>
              )}
            </div>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </div>
  );
}
