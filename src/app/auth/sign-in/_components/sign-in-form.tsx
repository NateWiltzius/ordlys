'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import StatusAlert from '@/components/shared/status-alert';

type Props = {
  initialErrorMessage?: string | null;
  nextPath: string;
};

export function SignInForm({ initialErrorMessage = null, nextPath }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      window.location.replace(nextPath);
    } catch {
      setErrorMessage('Unable to sign in right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="form-field">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          disabled={isSubmitting}
          className="w-full"
          autoFocus
        />
      </div>
      <div className="form-field">
        <Label htmlFor="password">Password</Label>

        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={isSubmitting}
          className="w-full"
        />
        <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      {errorMessage ? <StatusAlert status="danger">{errorMessage}</StatusAlert> : null}
      <Button type="submit" variant="primary" className="mt-1 w-full" isPending={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
