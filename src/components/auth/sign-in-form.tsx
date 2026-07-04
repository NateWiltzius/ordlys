'use client';

import { useState } from 'react';
import { Button, Card, Input, Label } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = createClient();

    await supabase.auth.signInWithPassword({
      email,
      password,
    });

    router.replace('/dashboard');
    router.refresh();
  };

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title>Sign in</Card.Title>
        <Card.Description>Continue learning with your saved decks and progress.</Card.Description>
      </Card.Header>
      <Card.Content>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" className="mt-2">
            Sign in
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
