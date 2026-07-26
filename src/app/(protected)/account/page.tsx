import AccountContent from '@/app/(protected)/account/_components/account-content';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import AccountLoading from '@/app/(protected)/account/loading';
import PageHeader from '@/components/shared/layout/page-header';

export const metadata: Metadata = {
  title: 'Account',
  description: 'View and manage your Ordlys account.',
};

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Account" description="View and manage your Ordlys account." />
      <Suspense fallback={<AccountLoading showHeader={false} />}>
        <AccountContent />
      </Suspense>
    </div>
  );
}
