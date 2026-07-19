import { SignUpForm } from '@/app/auth/sign-up/_components/sign-up-form';
import AuthShell from '@/app/auth/_components/auth-shell';
import { safeInternalRedirect } from '@/lib/redirect';
import type { Metadata } from 'next';
import Link from 'next/link';

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
    <AuthShell
      title="Create your account"
      description="Start building decks and keep your learning progress."
      footer={
        <p className="text-sm text-default-500">
          Already have an account?{' '}
          <Link
            href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <SignUpForm nextPath={nextPath} />
    </AuthShell>
  );
}
