import { redirect } from 'next/navigation';

import PageShell from '@/components/shared/layout/page-shell';
import { createClient } from '@/lib/supabase/server';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect('/auth/sign-in');
  }

  return <PageShell>{children}</PageShell>;
}
