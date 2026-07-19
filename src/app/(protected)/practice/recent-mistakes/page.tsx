import RecentMistakesMode from '@/app/(protected)/practice/recent-mistakes/_components/recent-mistakes-mode';
import ButtonLink from '@/components/shared/button-link';
import StudySession from '@/components/shared/layout/study-session';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { getRecentMistakesAction } from '@/server/review.actions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Extra practice',
  description: 'Optionally revisit vocabulary missed during the last 24 hours.',
};

export default async function RecentMistakesPage() {
  const quizItems = await getRecentMistakesAction();

  if (quizItems.length === 0) {
    return (
      <StudySession className="space-y-6">
        <header className="space-y-2">
          <h1 className={`text-2xl font-semibold ${STUDY_TONE_STYLES.practice.text}`}>
            Extra practice
          </h1>
          <p className="text-sm text-default-500">
            Optional practice from the last 24 hours. Answers here do not change your review
            schedule.
          </p>
        </header>
        <section className="space-y-5 border-y border-default-200 py-6">
          <div className="space-y-1">
            <h2 className="font-semibold">No extra practice right now</h2>
            <p className="text-sm text-default-500">
              Words you miss during study appear here for 24 hours.
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
    <StudySession className="space-y-6">
      <header className="space-y-2">
        <h1 className={`text-2xl font-semibold ${STUDY_TONE_STYLES.practice.text}`}>
          Extra practice
        </h1>
        <p className="text-sm text-default-500">
          Optional practice from the last 24 hours. Answers here do not change your review schedule.
        </p>
      </header>
      <RecentMistakesMode quizItems={quizItems} />
    </StudySession>
  );
}
