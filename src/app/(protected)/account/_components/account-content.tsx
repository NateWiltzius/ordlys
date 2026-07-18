import SignOutControl from '@/app/_components/sign-out-control';
import DeleteAccountModal from '@/app/(protected)/account/_components/delete-account-modal';
import ButtonLink from '@/components/shared/button-link';
import PageHeader from '@/components/shared/layout/page-header';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@heroui/react';

export default async function AccountContent() {
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
        <Card.Header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="card__title">Your data</h2>
            <Card.Description>
              Download your profile, authored decks, follows, learning history, feedback, and deck
              reports as JSON. Individual owned decks can also be exported as CSV from their deck
              page.
            </Card.Description>
          </div>
          <ButtonLink
            href="/account/export"
            variant="secondary"
            className="shrink-0"
            download="ordlys-account-data.json"
          >
            Download my data
          </ButtonLink>
        </Card.Header>
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
          <SignOutControl variant="account" />
        </Card.Content>
      </Card>

      <Card className="border-danger/30">
        <Card.Header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="card__title">Delete account</h2>
            <Card.Description>
              Permanently remove your sign-in account and learning history. Deck releases that other
              learners depend on may be retained without your account identifier.
            </Card.Description>
          </div>
          <div className="shrink-0">
            <DeleteAccountModal />
          </div>
        </Card.Header>
      </Card>
    </div>
  );
}
