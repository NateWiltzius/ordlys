import SignOutControl from '@/app/_components/sign-out-control';
import DeleteAccountModal from '@/app/(protected)/account/_components/delete-account-modal';
import ButtonLink from '@/components/shared/button-link';
import PageHeader from '@/components/shared/layout/page-header';
import PageSection from '@/components/shared/layout/page-section';
import { createClient } from '@/lib/supabase/server';

export default async function AccountContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === 'string' ? data.claims.email : 'Not available';

  return (
    <div className="space-y-6">
      <PageHeader title="Account" description="View and manage your Ordlys account." />

      <PageSection title="Profile" description="Your account details.">
        <dl>
          <div className="space-y-1">
            <dt className="text-sm text-default-500">Email address</dt>
            <dd className="font-medium">{email}</dd>
          </div>
        </dl>
      </PageSection>

      <PageSection
        title="Your data"
        description="Download your profile, authored decks, follows, learning history, feedback, and deck reports as JSON. Individual owned decks can also be exported as CSV from their deck page."
        action={
          <ButtonLink
            href="/account/export"
            variant="secondary"
            download="ordlys-account-data.json"
          >
            Download my data
          </ButtonLink>
        }
      />

      <PageSection
        title="Security"
        description="Manage your password or sign out of this device."
        action={
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <ButtonLink href="/auth/forgot-password" variant="secondary">
              Reset password
            </ButtonLink>
            <SignOutControl variant="account" />
          </div>
        }
      />

      <PageSection
        title="Delete account"
        description="Permanently remove your sign-in account and learning history. Deck releases that other learners depend on may be retained without your account identifier."
        action={<DeleteAccountModal />}
        tone="danger"
      />
    </div>
  );
}
