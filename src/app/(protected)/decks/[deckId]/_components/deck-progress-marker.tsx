import { CheckIcon, MapIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { Card, ProgressBar } from '@heroui/react';
import { summarizeDeckProgress } from '@/lib/deck-progress';
import { LESSON_PROGRESSION_CONFIG } from '@/lib/srs/srs-config';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { LessonProgress } from '@/types/review.types';

type Props = {
  lessonProgress: LessonProgress[];
};

export default function DeckProgressMarker({ lessonProgress }: Props) {
  const progress = summarizeDeckProgress(lessonProgress);
  if (progress.lessons.length === 0) return null;

  const currentLesson = progress.currentLesson;
  const remainingMasteryWords = currentLesson
    ? Math.max(0, currentLesson.requiredWords - currentLesson.masteredWords)
    : 0;

  return (
    <Card className="overflow-hidden">
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
              progress.masteryComplete
                ? 'bg-success/10 text-success'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}
          >
            {progress.masteryComplete ? (
              <TrophyIcon className="size-6" aria-hidden="true" />
            ) : (
              <MapIcon className="size-6" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <Card.Title>Deck journey</Card.Title>
            <Card.Description>
              {progress.masteryComplete
                ? 'Every lesson milestone is complete.'
                : progress.allCardsIntroduced
                  ? 'Every card is in your review queue. Keep strengthening your recall.'
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
          <p className="text-xs font-medium text-default-500">introduced</p>
        </div>
      </Card.Header>

      <Card.Content className="space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-default-700">
              {progress.introducedCards} of {progress.totalCards} cards introduced
            </span>
            <span className="text-default-500">
              {progress.coveredLessons} of {progress.lessons.length} lessons covered
            </span>
          </div>
          <ProgressBar
            aria-label="Cards introduced across this deck"
            value={progress.introducedCards}
            maxValue={progress.totalCards}
            size="md"
          >
            <ProgressBar.Track>
              <ProgressBar.Fill className={STUDY_TONE_STYLES.learning.progress} />
            </ProgressBar.Track>
          </ProgressBar>
        </div>

        <div className="overflow-x-auto px-1 pt-1 pb-4">
          <ol className="flex min-w-max items-center" aria-label="Lesson journey">
            {progress.lessons.map((lesson, index) => {
              const isCovered = lesson.learnedWords >= lesson.totalWords;
              const isCurrent = lesson.lessonId === currentLesson?.lessonId;
              const isActive = isCurrent && !progress.masteryComplete;

              return (
                <li key={lesson.lessonId} className="flex items-center" title={lesson.lessonTitle}>
                  <span
                    className={`flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-blue-600 bg-blue-600 text-white ring-2 ring-blue-500/15'
                        : isCovered
                          ? 'border-success bg-success text-white'
                          : lesson.isUnlocked
                            ? 'border-default-300 bg-background text-default-600'
                            : 'border-default-200 bg-default-100 text-default-400'
                    }`}
                    aria-label={`${lesson.lessonTitle}: ${
                      isActive
                        ? 'current'
                        : isCovered
                          ? 'covered'
                          : lesson.isUnlocked
                            ? 'unlocked'
                            : 'locked'
                    }`}
                  >
                    {isCovered ? <CheckIcon className="size-4" aria-hidden="true" /> : index + 1}
                  </span>
                  {index < progress.lessons.length - 1 ? (
                    <span
                      className={`mx-1 h-0.5 w-10 sm:w-14 ${
                        progress.lessons[index + 1]?.isUnlocked ? 'bg-success' : 'bg-default-200'
                      }`}
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        {currentLesson && !progress.masteryComplete ? (
          <div className="space-y-2 rounded-xl border border-default-200 bg-default-50/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-default-800">{currentLesson.lessonTitle}</p>
                <p className="text-sm text-default-500">
                  Lesson {progress.currentLessonNumber} of {progress.lessons.length} ·{' '}
                  {currentLesson.learnedWords} of {currentLesson.totalWords} cards introduced
                </p>
              </div>
              <p className="text-sm font-medium text-default-700">
                {currentLesson.masteredWords} / {currentLesson.requiredWords} at level{' '}
                {LESSON_PROGRESSION_CONFIG.unlockDisplayLevel}
              </p>
            </div>
            <ProgressBar
              aria-label={`Mastery progress toward unlocking ${progress.nextLesson?.lessonTitle ?? 'deck completion'}`}
              value={currentLesson.masteredWords}
              maxValue={currentLesson.requiredWords}
              color="success"
              size="sm"
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="text-sm text-default-600">
              {remainingMasteryWords === 0
                ? progress.nextLesson
                  ? `${progress.nextLesson.lessonTitle} unlocked`
                  : 'Final lesson milestone reached'
                : `${remainingMasteryWords} more ${
                    remainingMasteryWords === 1 ? 'card' : 'cards'
                  } at level ${LESSON_PROGRESSION_CONFIG.unlockDisplayLevel} to ${
                    progress.nextLesson ? 'unlock the next lesson' : 'complete the final milestone'
                  }`}
            </p>
          </div>
        ) : null}
      </Card.Content>
    </Card>
  );
}
