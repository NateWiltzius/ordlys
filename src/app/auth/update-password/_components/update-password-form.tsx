'use client';

import StatusAlert from '@/components/shared/status-alert';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Label } from '@heroui/react';
import { FormEvent, useState } from 'react';

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const { error: authError } = await createClient().auth.updateUser({ password });
      if (authError) throw authError;
      window.location.replace('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update your password.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={submit}>
      <div className="form-field">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
      </div>
      {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
      <Button type="submit" variant="primary" className="w-full" isPending={pending}>
        Update password
      </Button>
    </form>
  );
}
