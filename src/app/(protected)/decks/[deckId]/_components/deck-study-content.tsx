import { getCachedLessonProgress } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-lesson-progress';
import ButtonLink from '@/components/shared/button-link';
import StudySummary from '@/components/shared/study-summary';
import { LESSON_PROGRESSION_CONFIG } from '@/lib/srs/srs-config';
import { getDeckStudyCountsAction } from '@/server/deck.actions';
import { Deck } from '@/types/deck.types';
import { Button, Card, ProgressBar } from '@heroui/react';
import SubscribeDeckButton from '@/app/(protected)/decks/[deckId]/_components/subscribe-deck-button';

type Props = {
  deck: Deck;
  userId: string;
  canStudy: boolean;
};

export default async function DeckStudyContent({ deck, userId, canStudy }: Props) {
  const [counts, lessonProgress] = await Promise.all([
    getDeckStudyCountsAction(deck.id),
    getCachedLessonProgress(deck.id, userId),
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
        <Card className="h-full">
          <Card.Header>
            <Card.Title>Learn new words</Card.Title>
            <Card.Description>
              Add new vocabulary from this deck into your active review queue.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-3xl font-semibold">{counts.newWordsAvailable}</p>
            <p className="text-sm text-default-500">Ready to learn</p>
          </Card.Content>
          <Card.Footer>
            {canStudy ? (
              <ButtonLink href={`/decks/${deck.id}/learn`} className="w-full">
                Start learning
              </ButtonLink>
            ) : (
              <SubscribeDeckButton deckId={deck.id} />
            )}
          </Card.Footer>
        </Card>

        <Card className="h-full">
          <Card.Header>
            <Card.Title>Review due cards</Card.Title>
            <Card.Description>
              Practice words that are ready for review and keep your memory fresh.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-3xl font-semibold">{counts.reviewsDue}</p>
            <p className="text-sm text-default-500">reviews due</p>
          </Card.Content>
          <Card.Footer>
            {canStudy ? (
              <ButtonLink href={`/decks/${deck.id}/review`} variant="primary" className="w-full">
                Review now
              </ButtonLink>
            ) : (
              <Button variant="primary" className="w-full" isDisabled>
                Review now
              </Button>
            )}
          </Card.Footer>
        </Card>
      </div>

      <StudySummary counts={counts} description="Your progress in this deck." />
    </div>
  );
}
