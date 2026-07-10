import { SignUpForm } from '@/app/auth/sign-up/_components/sign-up-form';
import { safeInternalRedirect } from '@/lib/redirect';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create an Ordlys account and start learning vocabulary.',
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const nextPath = safeInternalRedirect((await searchParams).next);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <SignUpForm nextPath={nextPath} />
      </div>
    </div>
  );
}
