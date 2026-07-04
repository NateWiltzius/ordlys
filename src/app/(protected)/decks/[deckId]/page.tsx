import { getAccessibleDeckById } from '@/db/queries/deck.queries';
import { getUserVocabLevelsByDeckId, getVocabByDeckId } from '@/db/queries/vocab.queries';
import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/shared/layout/page-header';
import { getDeckStudyCountsAction, getUserSubscribedDecksAction } from '@/server/deck.actions';
import { Accordion, Button, Card, Chip, ProgressBar } from '@heroui/react';
import { notFound } from 'next/navigation';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { subscribeUserToDeckAction } from '@/server/deck-subscription.actions';
import { getLessonProgressForDeckAction } from '@/server/review.actions';
import { LESSON_PROGRESSION_CONFIG } from '@/lib/srs/srs-config';
import UnsubscribeDeckButton from '@/components/deck/unsubscribe-deck-button';
import ButtonLink from '@/components/shared/button-link';
import VocabTable from '@/components/vocab/vocab-table';
import { Vocab } from '@/types/vocab.types';
import StudySummary from '@/components/shared/study-summary';
import EmptyState from '@/components/shared/empty-state';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const currentUserId = data.user?.id;
  if (!currentUserId) notFound();

  const deck = await getAccessibleDeckById(parsedDeckId, currentUserId);
  if (!deck) notFound();

  const [counts, subscribedDecks, lessonProgress, vocabs, userVocabLevels] = await Promise.all([
    getDeckStudyCountsAction(parsedDeckId),
    getUserSubscribedDecksAction(),
    getLessonProgressForDeckAction(parsedDeckId),
    getVocabByDeckId(parsedDeckId),
    getUserVocabLevelsByDeckId(parsedDeckId, currentUserId),
  ]);

  const isOwned = Boolean(currentUserId && deck.ownerId === currentUserId);
  const isSubscribed = subscribedDecks.some(subscribedDeck => subscribedDeck.id === deck.id);
  const canStudy = isOwned || isSubscribed;
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
  const vocabsByLesson = vocabs.reduce<Record<number, Vocab[]>>((groupedVocabs, vocab) => {
    groupedVocabs[vocab.lessonId] ??= [];
    groupedVocabs[vocab.lessonId].push(vocab);
    return groupedVocabs;
  }, {});
  const srsLevelsByVocabId = Object.fromEntries(
    userVocabLevels.map(state => [state.vocabId, state.srsLevel]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={deck.title}
        description={
          isOwned
            ? 'You manage this deck and can edit its lessons and vocabulary.'
            : deck.deletedAt
              ? 'The owner removed this deck, but your subscription and progress are preserved.'
              : isSubscribed
                ? 'You are currently learning this deck. Review due cards and keep going.'
                : 'This is a public deck. Start learning it to add it to your active study list.'
        }
        actions={
          isOwned ? (
            <ButtonLink href={`/decks/${deck.id}/edit`} variant="secondary">
              Edit deck
            </ButtonLink>
          ) : isSubscribed ? (
            <UnsubscribeDeckButton deckId={deck.id} />
          ) : null
        }
      >
        {isOwned ? (
          <Chip color="warning" size="sm">
            You own this deck
          </Chip>
        ) : deck.deletedAt ? (
          <Chip color="warning" size="sm">
            Retained subscription
          </Chip>
        ) : isSubscribed ? (
          <Chip color="success" size="sm">
            You are learning this deck
          </Chip>
        ) : (
          <Chip size="sm">Public deck</Chip>
        )}
      </PageHeader>

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
        <Card variant="tertiary" className="h-full">
          <Card.Header>
            <Card.Title>Learn new words</Card.Title>
            <Card.Description>
              Add new vocabulary from this deck into your active review queue.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-3xl font-semibold">{counts.newWordsAvailable}</p>
            <p className="text-sm text-default-500">new words available</p>
          </Card.Content>
          <Card.Footer>
            {canStudy ? (
              <ButtonLink href={`/decks/${deck.id}/learn`} className="w-full">
                Start learning
              </ButtonLink>
            ) : (
              <form action={subscribeUserToDeckAction.bind(null, deck.id)} className="w-full">
                <Button type="submit" variant="primary" className="w-full">
                  Start learning this deck
                </Button>
              </form>
            )}
          </Card.Footer>
        </Card>

        <Card variant="secondary" className="h-full">
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
              <ButtonLink href={`/decks/${deck.id}/review`} variant="secondary" className="w-full">
                Review now
              </ButtonLink>
            ) : (
              <Button variant="secondary" className="w-full" isDisabled={!canStudy}>
                Review now
              </Button>
            )}
          </Card.Footer>
        </Card>
      </div>

      <StudySummary counts={counts} description="Your progress in this deck." />

      <Card>
        <Card.Header>
          <Card.Title>Lessons</Card.Title>
          <Card.Description>The lessons included in this deck.</Card.Description>
        </Card.Header>
        <Card.Content>
          {lessonProgress.length === 0 ? (
            <EmptyState title="No lessons yet" />
          ) : (
            <Accordion>
              {lessonProgress.map(lesson => {
                const lessonVocabs = vocabsByLesson[lesson.lessonId] ?? [];

                return (
                  <Accordion.Item key={lesson.lessonId} id={String(lesson.lessonId)}>
                    <Accordion.Heading>
                      <Accordion.Trigger>
                        <span className="flex flex-1 items-center justify-between gap-4 text-left">
                          <span className="font-medium">{lesson.lessonTitle}</span>
                          {lesson.totalWords === 0 ? (
                            <Chip size="sm">Empty</Chip>
                          ) : lesson.isUnlocked ? (
                            <Chip size="sm" color="success">
                              {lesson.masteredWords} / {lesson.requiredWords} at level{' '}
                              {LESSON_PROGRESSION_CONFIG.unlockSrsLevel}
                            </Chip>
                          ) : (
                            <Chip size="sm">Locked</Chip>
                          )}
                        </span>
                        <Accordion.Indicator />
                      </Accordion.Trigger>
                    </Accordion.Heading>
                    <Accordion.Panel>
                      <Accordion.Body>
                        {canStudy && lesson.totalWords > 0 ? (
                          <div className="mb-4 flex justify-end">
                            <ButtonLink
                              href={`/decks/${deck.id}/placement/${lesson.lessonId}`}
                              variant="secondary"
                              size="sm"
                            >
                              Take placement test
                            </ButtonLink>
                          </div>
                        ) : null}
                        <VocabTable
                          vocabs={lessonVocabs}
                          emptyTitle="No vocabulary in this lesson"
                          srsLevels={srsLevelsByVocabId}
                          showSrsLevels
                        />
                      </Accordion.Body>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
