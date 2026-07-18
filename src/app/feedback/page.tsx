import FeedbackForm from '@/app/feedback/_components/feedback-form';
import PageHeader from '@/components/shared/layout/page-header';
import PageShell from '@/components/shared/layout/page-shell';
import ButtonLink from '@/components/shared/button-link';
import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import { Card } from '@heroui/react';
import type { Metadata } from 'next';
import SemanticCardTitle from '@/components/shared/semantic-card-title';

export const metadata: Metadata = {
  title: 'Feedback',
  description: 'Send me feedback about Ordlys or get in touch directly.',
  robots: { index: false, follow: false },
};

export default async function FeedbackPage() {
  const [userId, contactEmail] = await Promise.all([
    getCurrentUserIdOrNull(),
    Promise.resolve(process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Feedback and contact"
        description="Tell me what is confusing, broken, missing, or surprisingly nice."
      />

      <Card>
        <Card.Header>
          <SemanticCardTitle level={2}>
            {userId ? 'Send me feedback' : 'Get in touch'}
          </SemanticCardTitle>
          <Card.Description>
            {userId
              ? 'Your note comes straight to me, and I read every one.'
              : 'Sign in to send feedback here, or email me directly.'}
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          {userId ? <FeedbackForm /> : <ButtonLink href="/auth/sign-in">Sign in</ButtonLink>}
          {contactEmail ? (
            <p className="text-sm text-default-600">
              Email me:{' '}
              <a className="text-primary underline" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            </p>
          ) : null}
        </Card.Content>
      </Card>
    </PageShell>
  );
}
