import RecentMistakesMode from '@/app/(protected)/practice/recent-mistakes/_components/recent-mistakes-mode';
import ButtonLink from '@/components/shared/button-link';
import StudySession from '@/components/shared/layout/study-session';
import StudySessionHeader from '@/components/shared/layout/study-session-header';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { getRecentMistakesAction } from '@/server/review.actions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Extra practice',
  description: 'Optionally revisit cards missed during the last 24 hours.',
};

export default async function RecentMistakesPage() {
  const quizItems = await getRecentMistakesAction();

  if (quizItems.length === 0) {
    return (
      <StudySession>
        <StudySessionHeader
          title="Extra practice"
          description="Missed cards from the last 24 hours · Review schedule unchanged"
          tone="practice"
          exitHref="/dashboard"
          exitLabel="Exit to Today"
        />
        <section className="space-y-5 border-y border-default-200 py-6">
          <div className="space-y-1">
            <h2 className="font-semibold">No extra practice right now</h2>
            <p className="text-sm text-default-500">
              Cards you miss during study appear here for 24 hours.
            </p>
          </div>
          <ButtonLink href="/dashboard" className={STUDY_TONE_STYLES.practice.button}>
            Back to Today
          </ButtonLink>
        </section>
      </StudySession>
    );
  }

  return (
    <StudySession>
      <StudySessionHeader
        title="Extra practice"
        description="Missed cards from the last 24 hours · Review schedule unchanged"
        tone="practice"
        exitHref="/dashboard"
        exitLabel="Exit to Today"
      />
      <RecentMistakesMode quizItems={quizItems} />
    </StudySession>
  );
}
