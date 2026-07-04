'use client';

import { useState } from 'react';
import { Button, Card, Input, Label } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

      router.replace('/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Unable to sign in right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full overflow-hidden border border-default-200 shadow-sm">
      <Card.Header className="space-y-1 border-b border-default-200 bg-default-50 px-6 py-5">
        <Card.Title className="text-2xl">Welcome back</Card.Title>
        <Card.Description>Sign in to continue learning with your saved progress.</Card.Description>
      </Card.Header>
      <Card.Content className="px-6 py-6">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
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
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
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
          </div>
          {errorMessage ? (
            <p
              role="alert"
              className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {errorMessage}
            </p>
          ) : null}
          <Button type="submit" variant="primary" className="mt-1 w-full" isPending={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Card.Content>
      <Card.Footer className="justify-center border-t border-default-200 bg-default-50 px-6 py-4">
        <p className="text-sm text-default-500">
          New to Ordlys?{' '}
          <Link href="/auth/sign-up" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </Card.Footer>
    </Card>
  );
}
