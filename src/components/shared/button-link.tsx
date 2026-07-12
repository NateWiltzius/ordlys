import { buttonVariants } from '@heroui/react';
import Link from 'next/link';
import { ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  variant?: 'danger' | 'danger-soft' | 'ghost' | 'outline' | 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  download?: boolean | string;
};

export default function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className,
  download,
}: Props) {
  return (
    <Link href={href} download={download} className={buttonVariants({ variant, size, className })}>
      {children}
    </Link>
  );
}
