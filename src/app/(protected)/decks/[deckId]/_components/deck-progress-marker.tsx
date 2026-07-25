import { TrophyIcon } from '@heroicons/react/24/outline';
import { ProgressBar } from '@heroui/react';
import { summarizeDeckProgress } from '@/lib/deck-progress';
import type { LessonProgress } from '@/types/review.types';
import DeckCoverage from '@/components/shared/deck-coverage';

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
  const remainingIntroducedWords = currentLesson
    ? Math.max(0, currentLesson.totalWords - currentLesson.introducedWords)
    : 0;

  return (
    <section className="border-t border-default-200 pt-6">
      <div>
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
                ? 'You have started every card. Keep strengthening your recall.'
                : currentLesson
                  ? `Currently working through ${currentLesson.lessonTitle}.`
                  : 'Start learning to begin your journey.'}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="space-y-2">
          <DeckCoverage
            started={progress.introducedCards}
            total={progress.totalCards}
            deckTitle="Deck journey"
            size="md"
          />
          <p className="text-sm text-default-500">
            {progress.coveredLessons} of {progress.lessons.length} lessons covered
          </p>
        </div>

        {currentLesson && !progress.lessonMilestonesComplete ? (
          <div className="mt-5 space-y-3 border-l-2 border-blue-500/40 pl-4 sm:pl-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-default-800">{currentLesson.lessonTitle}</p>
                <p className="text-sm text-default-500">
                  Current milestone &middot; Lesson {progress.currentLessonNumber} of{' '}
                  {progress.lessons.length}
                </p>
              </div>
              <p className="text-sm font-medium text-default-700">
                {Math.min(currentLesson.learnedWords, currentLesson.requiredWords)} of{' '}
                {currentLesson.requiredWords} cards strengthened
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
                : progress.nextLesson && remainingIntroducedWords > 0
                  ? `Introduce ${remainingIntroducedWords} more ${
                      remainingIntroducedWords === 1 ? 'card' : 'cards'
                    }, or strengthen ${remainingLearnedWords} more, to unlock ${
                      progress.nextLesson.lessonTitle
                    }`
                  : `${remainingLearnedWords} more ${
                      remainingLearnedWords === 1 ? 'card' : 'cards'
                    } to strengthen before you ${
                      progress.nextLesson
                        ? 'unlock the next lesson'
                        : 'complete the final milestone'
                    }`}
            </p>
            <p className="text-xs text-default-500">
              {currentLesson.introducedWords} of {currentLesson.totalWords} cards introduced in this
              lesson
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
