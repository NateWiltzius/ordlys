import { redirect } from 'next/navigation';

import PageShell from '@/components/shared/layout/page-shell';
import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  if (!(await getCurrentUserIdOrNull())) {
    redirect('/auth/sign-in');
  }

  return <PageShell>{children}</PageShell>;
}
