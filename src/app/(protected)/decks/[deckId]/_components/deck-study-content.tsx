import { getCachedLessonProgress } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-lesson-progress';
import StudySummary from '@/components/shared/study-summary';
import { LESSON_PROGRESSION_CONFIG } from '@/lib/srs/srs-config';
import { getDeckStudyCountsAction } from '@/server/deck.actions';
import { Deck } from '@/types/deck.types';
import { Button, Card, ProgressBar } from '@heroui/react';
import SubscribeDeckButton from '@/app/(protected)/decks/[deckId]/_components/subscribe-deck-button';
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import StudyActionCard from '@/app/(protected)/decks/[deckId]/_components/study-action-card';

type Props = {
  deck: Deck;
  canStudy: boolean;
};

export default async function DeckStudyContent({ deck, canStudy }: Props) {
  const [counts, lessonProgress] = await Promise.all([
    getDeckStudyCountsAction(deck.id),
    getCachedLessonProgress(deck.id),
  ]);
  const nonEmptyLessonProgress = lessonProgress.filter(lesson => lesson.totalWords > 0);
  const currentLesson =
    nonEmptyLessonProgress.find(
      lesson =>
        lesson.isUnlocked &&
        (lesson.learnedWords < lesson.totalWords || lesson.masteredWords < lesson.requiredWords),
    ) ?? nonEmptyLessonProgress.findLast(lesson => lesson.isUnlocked);
  const currentLessonNumber = currentLesson
    ? nonEmptyLessonProgress.findIndex(lesson => lesson.lessonId === currentLesson.lessonId) + 1
    : 0;
  const nextLesson = currentLesson
    ? nonEmptyLessonProgress[currentLessonNumber]
    : nonEmptyLessonProgress[0];

  return (
    <div className="space-y-6">
      {currentLesson ? (
        <Card>
          <Card.Header>
            <Card.Title>{currentLesson.lessonTitle}</Card.Title>
            <Card.Description>
              Lesson {currentLessonNumber} of {nonEmptyLessonProgress.length} ·{' '}
              {currentLesson.learnedWords} of {currentLesson.totalWords} words introduced
            </Card.Description>
          </Card.Header>
          <Card.Content className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-default-600">
                SRS level {LESSON_PROGRESSION_CONFIG.unlockSrsLevel}
              </span>
              <span className="font-medium">
                {currentLesson.masteredWords} / {currentLesson.requiredWords}
              </span>
            </div>
            <ProgressBar
              aria-label={`Progress toward unlocking ${nextLesson?.lessonTitle ?? 'deck completion'}`}
              value={currentLesson.masteredWords}
              maxValue={currentLesson.requiredWords}
              color="success"
              size="md"
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="text-sm text-default-600">
              {currentLesson.masteredWords >= currentLesson.requiredWords
                ? nextLesson
                  ? `${nextLesson.lessonTitle} unlocked`
                  : 'Lesson requirement complete'
                : `${currentLesson.requiredWords - currentLesson.masteredWords} more ${
                    currentLesson.requiredWords - currentLesson.masteredWords === 1
                      ? 'word'
                      : 'words'
                  } at SRS level ${LESSON_PROGRESSION_CONFIG.unlockSrsLevel} to unlock the next lesson`}
            </p>
          </Card.Content>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <StudyActionCard
          title="Learn new words"
          description="Add new vocabulary from this deck into your active review queue."
          count={counts.newWordsAvailable}
          countLabel="ready to learn"
          actionLabel="Start learning"
          icon={SparklesIcon}
          tone="learning"
          href={canStudy ? `/decks/${deck.id}/learn` : undefined}
          unavailableAction={<SubscribeDeckButton deckId={deck.id} />}
        />

        <StudyActionCard
          title="Review due cards"
          description="Practice words that are ready for review and keep your memory fresh."
          count={counts.reviewsDue}
          countLabel="reviews due"
          actionLabel="Review now"
          icon={ClockIcon}
          tone="review"
          href={canStudy ? `/decks/${deck.id}/review` : undefined}
          unavailableAction={
            <Button variant="primary" size="lg" className="w-full" isDisabled>
              Review now
            </Button>
          }
        />
      </div>

      <StudySummary counts={counts} description="Your progress in this deck." />
    </div>
  );
}
