'use client';

import { createClient } from '@/lib/supabase/client';
import { Button, Card, Input, Label } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { error: authError } = await createClient().auth.updateUser({ password });
      if (authError) throw authError;
      router.replace('/dashboard');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update your password.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md overflow-hidden border border-default-200 shadow-sm">
        <Card.Header className="space-y-1 border-b border-default-200 bg-default-50 px-6 py-5">
          <Card.Title>Choose a new password</Card.Title>
          <Card.Description>Enter a secure password for your Ordlys account.</Card.Description>
        </Card.Header>
        <Card.Content className="px-6 py-6">
          <form className="flex flex-col gap-5" onSubmit={submit}>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="primary" className="w-full" isPending={pending}>
              Update password
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
