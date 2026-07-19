import { MapIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { Card, ProgressBar } from '@heroui/react';
import { summarizeDeckProgress } from '@/lib/deck-progress';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { LessonProgress } from '@/types/review.types';
import SemanticCardTitle from '@/components/shared/semantic-card-title';
import LessonJourney from '@/app/(protected)/decks/[deckId]/_components/lesson-journey';

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
    <Card className="overflow-hidden">
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
              progress.lessonMilestonesComplete
                ? 'bg-success/10 text-success'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}
          >
            {progress.lessonMilestonesComplete ? (
              <TrophyIcon className="size-6" aria-hidden="true" />
            ) : (
              <MapIcon className="size-6" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <SemanticCardTitle level={2}>Deck journey</SemanticCardTitle>
            <Card.Description>
              {progress.lessonMilestonesComplete
                ? 'Every lesson milestone is complete.'
                : progress.allCardsIntroduced
                  ? 'You have started every word. Keep strengthening your recall.'
                  : currentLesson
                    ? `Currently working through ${currentLesson.lessonTitle}.`
                    : 'Start learning to begin your journey.'}
            </Card.Description>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-2xl font-semibold tracking-tight text-blue-600 dark:text-blue-400">
            {progress.percentage}%
          </p>
          <p className="text-xs font-medium text-default-500">started</p>
        </div>
      </Card.Header>

      <Card.Content className="space-y-5">
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
          <div className="space-y-2 rounded-xl border border-default-200 bg-default-50/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-default-800">{currentLesson.lessonTitle}</p>
                <p className="text-sm text-default-500">
                  Lesson {progress.currentLessonNumber} of {progress.lessons.length} ·{' '}
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
      </Card.Content>
    </Card>
  );
}
