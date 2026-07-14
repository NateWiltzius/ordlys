'use client';

import { useState } from 'react';
import { Button, Card, Input, Label } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import StatusAlert from '@/components/shared/status-alert';

type Props = {
  nextPath: string;
};

export function SignUpForm({ nextPath }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data.session) {
        setSuccessMessage('Check your email to confirm your account, then sign in.');
        return;
      }

      window.location.replace(nextPath);
    } catch {
      setErrorMessage('Unable to create your account right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full overflow-hidden">
      <Card.Header className="space-y-1 border-b border-default-200 bg-default-50 px-6 py-5">
        <Card.Title className="text-2xl">Create your account</Card.Title>
        <Card.Description>Start building decks and keep your learning progress.</Card.Description>
      </Card.Header>
      <Card.Content className="px-6 py-6">
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
            />
          </div>
          <div className="form-field">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          {errorMessage ? <StatusAlert status="danger">{errorMessage}</StatusAlert> : null}
          {successMessage ? <StatusAlert status="success">{successMessage}</StatusAlert> : null}
          <Button type="submit" variant="primary" className="mt-1 w-full" isPending={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
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
  );
}
