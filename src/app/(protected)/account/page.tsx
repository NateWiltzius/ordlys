import AccountContent from '@/app/(protected)/account/_components/account-content';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import AccountLoading from '@/app/(protected)/account/loading';

export const metadata: Metadata = {
  title: 'Account',
  description: 'View and manage your Ordlys account.',
};

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountContent />
    </Suspense>
  );
}
