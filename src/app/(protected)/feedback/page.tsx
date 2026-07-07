import FeedbackForm from '@/app/(protected)/feedback/_components/feedback-form';
import PageHeader from '@/components/shared/layout/page-header';
import { Card } from '@heroui/react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feedback',
  description: 'Send feedback about Ordlys.',
};

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="Tell me what is confusing, broken, missing, or surprisingly nice."
      />

      <Card>
        <Card.Header>
          <Card.Title>Send feedback</Card.Title>
          <Card.Description>Your note is saved directly for review.</Card.Description>
        </Card.Header>
        <Card.Content>
          <FeedbackForm />
        </Card.Content>
      </Card>
    </div>
  );
}
