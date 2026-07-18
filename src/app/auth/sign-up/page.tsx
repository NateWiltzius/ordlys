import { SignUpForm } from '@/app/auth/sign-up/_components/sign-up-form';
import SemanticCardTitle from '@/components/shared/semantic-card-title';
import { safeInternalRedirect } from '@/lib/redirect';
import { Card } from '@heroui/react';
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
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md overflow-hidden">
        <Card.Header className="space-y-1 border-b border-default-200 bg-default-50 px-6 py-5">
          <SemanticCardTitle level={1} className="text-2xl">
            Create your account
          </SemanticCardTitle>
          <Card.Description>Start building decks and keep your learning progress.</Card.Description>
        </Card.Header>
        <Card.Content className="px-6 py-6">
          <SignUpForm nextPath={nextPath} />
        </Card.Content>
        <Card.Footer className="justify-center border-t border-default-200 bg-default-50 px-6 py-4">
          <p className="text-sm text-default-500">
            Already have an account?{' '}
            <Link
              href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </Card.Footer>
      </Card>
    </div>
  );
}
