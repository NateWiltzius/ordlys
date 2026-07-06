import { Button, Card } from '@heroui/react';
import PageHeader from '@/components/shared/layout/page-header';
import ButtonLink from '@/components/shared/button-link';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from '@/server/auth.actions';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === 'string' ? data.claims.email : 'Not available';

  return (
    <div className="space-y-6">
      <PageHeader title="Account" description="View and manage your Ordlys account." />

      <Card>
        <Card.Header>
          <h2 className="card__title">Profile</h2>
          <Card.Description>Your account details.</Card.Description>
        </Card.Header>
        <Card.Content>
          <dl>
            <div className="space-y-1">
              <dt className="text-sm text-default-500">Email address</dt>
              <dd className="font-medium">{email}</dd>
            </div>
          </dl>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <h2 className="card__title">Security</h2>
          <Card.Description>Manage your password or sign out of this device.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-wrap gap-3">
          <ButtonLink href="/auth/forgot-password" variant="secondary">
            Reset password
          </ButtonLink>
          <form action={signOutAction}>
            <Button type="submit" variant="tertiary">
              Sign out
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
