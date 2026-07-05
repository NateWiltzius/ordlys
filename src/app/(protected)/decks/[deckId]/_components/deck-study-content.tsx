import { getCachedLessonProgress } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-lesson-progress';
import StudySummary from '@/components/shared/study-summary';
import { LESSON_PROGRESSION_CONFIG } from '@/lib/srs/srs-config';
import { getDeckStudyCountsAction } from '@/server/deck.actions';
import { Deck } from '@/types/deck.types';
import { buttonVariants, Button, Card, ProgressBar } from '@heroui/react';
import SubscribeDeckButton from '@/app/(protected)/decks/[deckId]/_components/subscribe-deck-button';
import { ArrowRightIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import Link from 'next/link';

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

  const learnCard = (
    <Card
      className={`group h-full overflow-hidden border bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent shadow-md transition duration-200 group-hover:-translate-y-0.5 group-hover:border-blue-500/50 group-hover:shadow-lg ${STUDY_TONE_STYLES.learning.surface}`}
    >
      <Card.Header className="flex-row items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${STUDY_TONE_STYLES.learning.accent}`}
        >
          <SparklesIcon className="size-6" aria-hidden="true" />
        </span>
        <div>
          <Card.Title className="text-lg">Learn new words</Card.Title>
          <Card.Description>
            Add new vocabulary from this deck into your active review queue.
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="flex items-baseline gap-2">
        <p className={`text-4xl font-bold tracking-tight ${STUDY_TONE_STYLES.learning.text}`}>
          {counts.newWordsAvailable}
        </p>
        <p className="font-medium text-default-600">ready to learn</p>
      </Card.Content>
      <Card.Footer>
        {canStudy ? (
          <span
            className={buttonVariants({
              variant: 'primary',
              size: 'lg',
              className: `w-full shadow-sm ${STUDY_TONE_STYLES.learning.button}`,
            })}
          >
            Start learning
            <ArrowRightIcon
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        ) : (
          <SubscribeDeckButton deckId={deck.id} />
        )}
      </Card.Footer>
    </Card>
  );

  const reviewCard = (
    <Card
      className={`group h-full overflow-hidden border bg-gradient-to-br from-success/15 via-success/5 to-transparent shadow-md transition duration-200 group-hover:-translate-y-0.5 group-hover:border-success/50 group-hover:shadow-lg ${STUDY_TONE_STYLES.review.surface}`}
    >
      <Card.Header className="flex-row items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${STUDY_TONE_STYLES.review.accent}`}
        >
          <ClockIcon className="size-6" aria-hidden="true" />
        </span>
        <div>
          <Card.Title className="text-lg">Review due cards</Card.Title>
          <Card.Description>
            Practice words that are ready for review and keep your memory fresh.
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="flex items-baseline gap-2">
        <p className={`text-4xl font-bold tracking-tight ${STUDY_TONE_STYLES.review.text}`}>
          {counts.reviewsDue}
        </p>
        <p className="font-medium text-default-600">reviews due</p>
      </Card.Content>
      <Card.Footer>
        {canStudy ? (
          <span
            className={buttonVariants({
              variant: 'primary',
              size: 'lg',
              className: `w-full shadow-sm ${STUDY_TONE_STYLES.review.button}`,
            })}
          >
            Review now
            <ArrowRightIcon
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        ) : (
          <Button variant="primary" size="lg" className="w-full" isDisabled>
            Review now
          </Button>
        )}
      </Card.Footer>
    </Card>
  );

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
        {canStudy ? (
          <Link
            href={`/decks/${deck.id}/learn`}
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {learnCard}
          </Link>
        ) : (
          learnCard
        )}

        {canStudy ? (
          <Link
            href={`/decks/${deck.id}/review`}
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
          >
            {reviewCard}
          </Link>
        ) : (
          reviewCard
        )}
      </div>

      <StudySummary counts={counts} description="Your progress in this deck." />
    </div>
  );
}
