import FeedbackForm from '@/app/feedback/_components/feedback-form';
import PageHeader from '@/components/shared/layout/page-header';
import PageSection from '@/components/shared/layout/page-section';
import PageShell from '@/components/shared/layout/page-shell';
import ButtonLink from '@/components/shared/button-link';
import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import type { Metadata } from 'next';
import { getLegalContact } from '@/config/server-env';

export const metadata: Metadata = {
  title: 'Feedback',
  description: 'Send me feedback about Ordlys or get in touch directly.',
  robots: { index: false, follow: false },
};

export default async function FeedbackPage() {
  const userId = await getCurrentUserIdOrNull();
  const { contactEmail } = getLegalContact();

  return (
    <PageShell>
      <PageHeader
        title="Feedback and contact"
        description="Tell me what is confusing, broken, missing, or surprisingly nice."
      />

      <PageSection
        title={userId ? 'Send me feedback' : 'Get in touch'}
        description={
          userId
            ? 'Your note comes straight to me, and I read every one.'
            : 'Sign in to send feedback here, or email me directly.'
        }
        className="max-w-3xl"
        contentClassName="space-y-4"
      >
        <>
          {userId ? <FeedbackForm /> : <ButtonLink href="/auth/sign-in">Sign in</ButtonLink>}
          {contactEmail ? (
            <p className="text-sm text-default-600">
              Email me:{' '}
              <a className="text-primary underline" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            </p>
          ) : null}
        </>
      </PageSection>
    </PageShell>
  );
}
