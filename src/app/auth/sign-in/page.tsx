import { SignInForm } from '@/app/auth/sign-in/_components/sign-in-form';
import SemanticCardTitle from '@/components/shared/semantic-card-title';
import { safeInternalRedirect } from '@/lib/redirect';
import { Card } from '@heroui/react';
import type { Metadata } from 'next';
import Link from 'next/link';

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
      <Card className="w-full max-w-md overflow-hidden">
        <Card.Header className="space-y-1 border-b border-default-200 bg-default-50 px-6 py-5">
          <SemanticCardTitle level={1} className="text-2xl">
            Welcome back
          </SemanticCardTitle>
          <Card.Description>
            Sign in to continue learning with your saved progress.
          </Card.Description>
        </Card.Header>
        <Card.Content className="px-6 py-6">
          <SignInForm nextPath={nextPath} />
        </Card.Content>
        <Card.Footer className="justify-center border-t border-default-200 bg-default-50 px-6 py-4">
          <p className="text-sm text-default-500">
            New to Ordlys?{' '}
            <Link
              href={`/auth/sign-up?next=${encodeURIComponent(nextPath)}`}
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
        </Card.Footer>
      </Card>
    </div>
  );
}
