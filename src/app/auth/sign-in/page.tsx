import { SignInForm } from '@/app/auth/sign-in/_components/sign-in-form';
import { safeInternalRedirect } from '@/lib/redirect';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Ordlys account.',
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const nextPath = safeInternalRedirect((await searchParams).next);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <SignInForm nextPath={nextPath} />
      </div>
    </div>
  );
}
