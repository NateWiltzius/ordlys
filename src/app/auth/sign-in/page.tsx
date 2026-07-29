import { SignInForm } from '@/app/auth/sign-in/_components/sign-in-form';
import AuthShell from '@/app/auth/_components/auth-shell';
import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import { safeInternalRedirect } from '@/lib/redirect';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Ordlys account.',
};

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const [params, userId] = await Promise.all([searchParams, getCurrentUserIdOrNull()]);
  const nextPath = safeInternalRedirect(params.next);
  if (userId) redirect(nextPath);

  const initialErrorMessage =
    params.error === 'confirmation_failed'
      ? 'That confirmation link is invalid or has expired. Request a new email and try again.'
      : null;

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue learning with your saved progress."
      footer={
        <p className="text-sm text-default-500">
          New to Ordlys?{' '}
          <Link
            href={`/auth/sign-up?next=${encodeURIComponent(nextPath)}`}
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <SignInForm nextPath={nextPath} initialErrorMessage={initialErrorMessage} />
    </AuthShell>
  );
}
