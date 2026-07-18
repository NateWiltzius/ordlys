import ForgotPasswordForm from '@/app/auth/forgot-password/_components/forgot-password-form';
import SemanticCardTitle from '@/components/shared/semantic-card-title';
import { Card } from '@heroui/react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md overflow-hidden">
        <Card.Header className="space-y-1 border-b border-default-200 bg-default-50 px-6 py-5">
          <SemanticCardTitle level={1} className="text-2xl">
            Reset your password
          </SemanticCardTitle>
          <Card.Description>We’ll email you a secure reset link.</Card.Description>
        </Card.Header>
        <Card.Content className="px-6 py-6">
          <ForgotPasswordForm />
        </Card.Content>
        <Card.Footer className="justify-center border-t border-default-200 bg-default-50 px-6 py-4">
          <Link href="/auth/sign-in" className="text-sm font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </Card.Footer>
      </Card>
    </div>
  );
}
