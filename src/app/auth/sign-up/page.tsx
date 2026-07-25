import { SignUpForm } from '@/app/auth/sign-up/_components/sign-up-form';
import AuthShell from '@/app/auth/_components/auth-shell';
import { safeInternalRedirect } from '@/lib/redirect';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create an Ordlys account and start learning with flashcards.',
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const nextPath = safeInternalRedirect((await searchParams).next);

  return (
    <AuthShell
      title="Create your account"
      description={
        nextPath === '/decks/55'
          ? 'Start Norwegian A1 and keep your learning progress.'
          : nextPath === '/decks?create=1'
            ? 'Create your first deck and keep its review schedule in sync.'
            : nextPath.includes('follow=1')
              ? 'Follow this deck and start studying with saved progress.'
              : 'Save your decks, review schedule, and learning progress.'
      }
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
