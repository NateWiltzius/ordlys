'use client';

import { createClient } from '@/lib/supabase/client';
import { Button, Card, Input, Label } from '@heroui/react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import StatusAlert from '@/components/shared/status-alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const { error: authError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (authError) throw authError;
      setMessage('If an account exists for that email, a reset link is on its way.');
    } catch {
      setError('Could not request a reset link. Please try again.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md overflow-hidden">
        <Card.Header className="space-y-1 border-b border-default-200 bg-default-50 px-6 py-5">
          <Card.Title className="text-2xl">Reset your password</Card.Title>
          <Card.Description>We’ll email you a secure reset link.</Card.Description>
        </Card.Header>
        <Card.Content className="px-6 py-6">
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {message ? <StatusAlert status="success">{message}</StatusAlert> : null}
            {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
            <Button type="submit" variant="primary" className="w-full" isPending={pending}>
              Send reset link
            </Button>
          </form>
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
