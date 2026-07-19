import RecentMistakesMode from '@/app/(protected)/practice/recent-mistakes/_components/recent-mistakes-mode';
import ButtonLink from '@/components/shared/button-link';
import PageHeader from '@/components/shared/layout/page-header';
import StudySession from '@/components/shared/layout/study-session';
import { getRecentMistakesAction } from '@/server/review.actions';
import { Card } from '@heroui/react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Extra practice',
  description: 'Optionally revisit vocabulary missed during the last 24 hours.',
};

export default async function RecentMistakesPage() {
  const quizItems = await getRecentMistakesAction();

  if (quizItems.length === 0) {
    return (
      <StudySession>
        <Card>
          <Card.Header>
            <Card.Title>No extra practice right now</Card.Title>
            <Card.Description>
              Words you miss during study appear here for 24 hours without changing their review
              schedule.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <ButtonLink href="/dashboard">Back to Today</ButtonLink>
          </Card.Footer>
        </Card>
      </StudySession>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extra practice"
        description="Optional practice from the last 24 hours. Answers here do not change your memory strength or review schedule."
      />
      <RecentMistakesMode quizItems={quizItems} />
    </div>
  );
}
