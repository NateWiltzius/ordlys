'use client';

import {
  isNavigationItemActive,
  navigationItemClassName,
} from '@/app/_components/navigation-items';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  href: string;
  label: string;
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

export default function NavigationLink({ href, label, variant, onNavigate }: Props) {
  const pathname = usePathname();
  const isActive = isNavigationItemActive(pathname, href);

  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={isActive ? 'page' : undefined}
      className={navigationItemClassName(variant, isActive)}
      onClick={onNavigate}
    >
      {label}
    </Link>
  );
}
