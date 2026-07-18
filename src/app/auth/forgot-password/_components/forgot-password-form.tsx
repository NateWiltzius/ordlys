'use client';

import StatusAlert from '@/components/shared/status-alert';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Label } from '@heroui/react';
import { FormEvent, useState } from 'react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
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
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <div className="form-field">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
        />
      </div>
      {message ? <StatusAlert status="success">{message}</StatusAlert> : null}
      {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
      <Button type="submit" variant="primary" className="w-full" isPending={pending}>
        Send reset link
      </Button>
    </form>
  );
}
