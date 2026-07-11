'use client';

import { Bars3Icon } from '@heroicons/react/24/outline';
import { Button, Popover } from '@heroui/react';
import { useState } from 'react';
import ThemeToggle from '@/app/_components/theme-toggle';
import { signOutAction } from '@/server/auth.actions';
import { getNavigationItems, navigationItemClassName } from '@/app/_components/navigation-items';
import NavigationLink from '@/app/_components/navigation-link';

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
                <NavigationLink
                  key={item.href}
                  {...item}
                  variant="mobile"
                  onNavigate={() => setIsOpen(false)}
                />
              ))}
              {loggedIn && (
                <form action={signOutAction} onSubmit={() => setIsOpen(false)}>
                  <button
                    type="submit"
                    className={`w-full bg-transparent text-left ${navigationItemClassName('mobile')}`}
                  >
                    Sign out
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
