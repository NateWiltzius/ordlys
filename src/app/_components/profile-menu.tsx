'use client';

import NavigationLink from '@/app/_components/navigation-link';
import {
  isNavigationItemActive,
  navigationItemClassName,
} from '@/app/_components/navigation-items';
import SignOutControl from '@/app/_components/sign-out-control';
import { ChevronDownIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Button, Popover } from '@heroui/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function ProfileMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = isNavigationItemActive(pathname, '/account');

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="tertiary"
        className={`${navigationItemClassName('desktop', isActive)} gap-1.5`}
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        <UserCircleIcon className="size-5" aria-hidden="true" />
        Profile
        <ChevronDownIcon
          className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </Button>
      <Popover.Content placement="bottom end">
        <Popover.Dialog className="w-48 p-1">
          <div className="flex flex-col">
            <NavigationLink
              href="/account"
              label="Account"
              variant="mobile"
              onNavigate={() => setIsOpen(false)}
            />
            <SignOutControl variant="mobile" onSignedOut={() => setIsOpen(false)} />
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
