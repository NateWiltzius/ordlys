import { TrophyIcon } from '@heroicons/react/24/outline';
import { ProgressBar } from '@heroui/react';
import LessonJourney from '@/app/(protected)/decks/[deckId]/_components/lesson-journey';
import { summarizeDeckProgress } from '@/lib/deck-progress';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { LessonProgress } from '@/types/review.types';

type Props = {
  lessonProgress: LessonProgress[];
};

export default function DeckProgressMarker({ lessonProgress }: Props) {
  const progress = summarizeDeckProgress(lessonProgress);
  if (progress.lessons.length === 0) return null;

  const currentLesson = progress.currentLesson;
  const remainingLearnedWords = currentLesson
    ? Math.max(0, currentLesson.requiredWords - currentLesson.learnedWords)
    : 0;

  return (
    <section className="border-t border-default-200 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            {progress.lessonMilestonesComplete ? (
              <TrophyIcon className="size-5 text-success" aria-hidden="true" />
            ) : null}
            Deck journey
          </h2>
          <p className="mt-1 text-sm leading-6 text-default-500">
            {progress.lessonMilestonesComplete
              ? 'Every lesson milestone is complete.'
              : progress.allCardsIntroduced
                ? 'You have started every word. Keep strengthening your recall.'
                : currentLesson
                  ? `Currently working through ${currentLesson.lessonTitle}.`
                  : 'Start learning to begin your journey.'}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className={`text-2xl font-semibold ${STUDY_TONE_STYLES.learning.text}`}>
            {progress.percentage}%
          </p>
          <p className="text-xs font-medium text-default-500">started</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-default-700">
              {progress.introducedCards} of {progress.totalCards} words started
            </span>
            <span className="text-default-500">
              {progress.coveredLessons} of {progress.lessons.length} lessons covered
            </span>
          </div>
          <ProgressBar
            aria-label="Words started across this deck"
            value={progress.introducedCards}
            maxValue={progress.totalCards}
            size="md"
          >
            <ProgressBar.Track>
              <ProgressBar.Fill className={STUDY_TONE_STYLES.learning.progress} />
            </ProgressBar.Track>
          </ProgressBar>
        </div>

        <LessonJourney
          lessons={progress.lessons}
          currentLessonId={currentLesson?.lessonId ?? null}
          isComplete={progress.lessonMilestonesComplete}
        />

        {currentLesson && !progress.lessonMilestonesComplete ? (
          <div className="space-y-3 border-y border-default-200 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-default-800">{currentLesson.lessonTitle}</p>
                <p className="text-sm text-default-500">
                  Lesson {progress.currentLessonNumber} of {progress.lessons.length} &middot;{' '}
                  {currentLesson.introducedWords} of {currentLesson.totalWords} words started
                </p>
              </div>
              <p className="text-sm font-medium text-default-700">
                {Math.min(currentLesson.learnedWords, currentLesson.requiredWords)} of{' '}
                {currentLesson.requiredWords} words strengthened
              </p>
            </div>
            <ProgressBar
              aria-label={`Learning progress toward unlocking ${progress.nextLesson?.lessonTitle ?? 'deck completion'}`}
              value={currentLesson.learnedWords}
              maxValue={currentLesson.requiredWords}
              color="success"
              size="sm"
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="text-sm text-default-600">
              {remainingLearnedWords === 0
                ? progress.nextLesson
                  ? `${progress.nextLesson.lessonTitle} unlocked`
                  : 'Final lesson milestone reached'
                : `${remainingLearnedWords} more ${
                    remainingLearnedWords === 1 ? 'word' : 'words'
                  } to strengthen before you ${
                    progress.nextLesson ? 'unlock the next lesson' : 'complete the final milestone'
                  }`}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
