import { ViewLessonButton } from '@/app/(protected)/decks/[deckId]/_components/deck-tabs';
import { ProgressBar } from '@heroui/react';
import { summarizeDeckProgress } from '@/lib/deck-progress';
import type { LessonProgress } from '@/types/review.types';

type Props = {
  lessonProgress: LessonProgress[];
};

export default function DeckProgressMarker({ lessonProgress }: Props) {
  const progress = summarizeDeckProgress(lessonProgress);
  const currentLesson = progress.currentLesson;
  if (!currentLesson || progress.lessonMilestonesComplete) return null;

  const strengthenedCards = Math.min(currentLesson.learnedWords, currentLesson.requiredWords);
  const remainingLearnedWords = Math.max(0, currentLesson.requiredWords - strengthenedCards);
  const remainingIntroducedWords = Math.max(
    0,
    currentLesson.totalWords - currentLesson.introducedWords,
  );
  const nextLessonUnlocked = progress.nextLesson?.isUnlocked;
  const nextStep = progress.nextLesson
    ? nextLessonUnlocked || remainingLearnedWords === 0
      ? `${progress.nextLesson.lessonTitle} is unlocked.`
      : `To unlock ${progress.nextLesson.lessonTitle}, ${
          remainingIntroducedWords > 0
            ? `introduce ${remainingIntroducedWords} more ${remainingIntroducedWords === 1 ? 'card' : 'cards'} or `
            : ''
        }strengthen ${remainingLearnedWords} more ${remainingLearnedWords === 1 ? 'card' : 'cards'}.`
    : remainingLearnedWords === 0
      ? 'Final lesson milestone reached.'
      : `Strengthen ${remainingLearnedWords} more ${remainingLearnedWords === 1 ? 'card' : 'cards'} to complete this lesson’s milestone.`;

  return (
    <section
      aria-label="Current lesson progress"
      className="rounded-xl border border-default-200 bg-default-50/50 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-medium text-default-600">Current lesson</h2>
        <div className="flex items-center gap-3">
          <p className="text-xs text-default-500">Lesson {progress.currentLessonNumber}</p>
          <ViewLessonButton lessonId={currentLesson.lessonId} />
        </div>
      </div>
      <h3 className="mt-1 break-words text-lg font-semibold text-foreground">
        {currentLesson.lessonTitle}
      </h3>

      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <p className="text-default-600">Cards strengthened</p>
          <p className="font-medium tabular-nums text-foreground">
            {strengthenedCards}{' '}
            <span className="font-normal text-default-500">of {currentLesson.requiredWords}</span>
          </p>
        </div>
        <ProgressBar
          aria-label={`${currentLesson.lessonTitle}: cards strengthened toward the lesson milestone`}
          value={strengthenedCards}
          maxValue={Math.max(1, currentLesson.requiredWords)}
          color="success"
          size="sm"
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <p className="text-xs text-default-500">
          {currentLesson.introducedWords} of {currentLesson.totalWords} cards introduced
        </p>
      </div>

      <p className="mt-4 border-t border-default-200 pt-3 text-sm leading-6 text-default-600">
        {nextStep}
      </p>
    </section>
  );
}
