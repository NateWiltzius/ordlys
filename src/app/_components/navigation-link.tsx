'use client';

import { navigationItemClassName } from '@/app/_components/navigation-items';
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
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={navigationItemClassName(variant, isActive)}
      onClick={onNavigate}
    >
      {label}
    </Link>
  );
}
