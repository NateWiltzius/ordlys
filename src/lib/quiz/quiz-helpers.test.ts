import { describe, expect, it } from 'vitest';
import {
  addFirstAttempt,
  addReviewWordToQueue,
  buildQuizQueue,
  buildRollingReviewQueue,
  getRequiredQuizDirections,
  getQuizAttemptOutcome,
  isQuizProgressComplete,
  REVIEW_ACTIVE_WORD_LIMIT,
} from './quiz-helpers';
import type { QuizSourceItem } from '@/types/quiz.types';

function buildSourceItem(id: number): QuizSourceItem {
  return {
    id,
    releaseId: 1,
    front: `term ${id}`,
    back: `meaning ${id}`,
    frontAlternatives: [],
    backAlternatives: [],
    frontToBackQuizHint: null,
    backToFrontQuizHint: null,
    reading: null,
    frontLanguage: null,
    backLanguage: null,
    studyDirection: 'both',
  };
}

describe('getQuizAttemptOutcome', () => {
  it('treats an automatically correct answer as accepted', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: true,
        wasOverridden: false,
      }),
    ).toEqual({
      isAccepted: true,
      shouldMarkMissed: false,
    });
  });

  it('treats an overridden answer as accepted for the session and SRS', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: false,
        wasOverridden: true,
      }),
    ).toEqual({
      isAccepted: true,
      shouldMarkMissed: false,
    });
  });

  it('marks a rejected answer as missed', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: false,
        wasOverridden: false,
      }),
    ).toEqual({
      isAccepted: false,
      shouldMarkMissed: true,
    });
  });
});

describe('buildQuizQueue', () => {
  it('keeps language-agnostic review context and vocabulary details in both directions', () => {
    const queue = buildQuizQueue([
      {
        id: 7,
        releaseId: 3,
        front: 'term',
        back: 'meaning',
        frontAlternatives: ['alternate term'],
        backAlternatives: ['alternate meaning'],
        frontToBackQuizHint: 'Front hint',
        backToFrontQuizHint: 'Back hint',
        reading: 'reading',
        notes: 'Usage note',
        frontLanguage: 'one',
        backLanguage: 'two',
        deckTitle: 'Deck',
        lessonTitle: 'Lesson',
        srsLevel: 2,
        studyDirection: 'both',
      },
    ]);

    expect(queue).toHaveLength(2);
    expect(queue[0]).toMatchObject({
      releaseId: 3,
      prompt: 'meaning',
      acceptedAnswers: ['term', 'alternate term'],
      reading: 'reading',
      notes: 'Usage note',
      deckTitle: 'Deck',
      lessonTitle: 'Lesson',
      srsLevel: 2,
    });
    expect(queue[1]).toMatchObject({
      releaseId: 3,
      prompt: 'term',
      acceptedAnswers: ['meaning', 'alternate meaning'],
      reading: 'reading',
      notes: 'Usage note',
      deckTitle: 'Deck',
      lessonTitle: 'Lesson',
      srsLevel: 2,
    });
  });

  it('only builds the configured direction for one-way decks', () => {
    const frontToBack = buildQuizQueue([{ ...buildSourceItem(1), studyDirection: 'ftb' }]);
    const backToFront = buildQuizQueue([{ ...buildSourceItem(2), studyDirection: 'btf' }]);

    expect(frontToBack.map(item => item.direction)).toEqual(['ftb']);
    expect(frontToBack[0]).toMatchObject({ prompt: 'term 1', answer: 'meaning 1' });
    expect(backToFront.map(item => item.direction)).toEqual(['btf']);
    expect(backToFront[0]).toMatchObject({ prompt: 'meaning 2', answer: 'term 2' });
  });
});

describe('quiz direction requirements', () => {
  it('only completes progress after every configured direction passes', () => {
    const progress = { cardId: 1, btfPassed: false, ftbPassed: true };

    expect(getRequiredQuizDirections('both')).toEqual(['btf', 'ftb']);
    expect(isQuizProgressComplete(progress, 'ftb')).toBe(true);
    expect(isQuizProgressComplete(progress, 'btf')).toBe(false);
    expect(isQuizProgressComplete(progress, 'both')).toBe(false);
  });
});

describe('rolling review queue', () => {
  it('starts with only ten active words and keeps the rest pending', () => {
    const reviewItems = Array.from({ length: 12 }, (_, index) => buildSourceItem(index + 1));
    const result = buildRollingReviewQueue(reviewItems);
    const activeCardIds = new Set(result.queue.map(item => item.cardId));
    const pendingCardIds = new Set(result.pendingItems.map(item => item.id));

    expect(result.queue).toHaveLength(REVIEW_ACTIVE_WORD_LIMIT * 2);
    expect(activeCardIds.size).toBe(REVIEW_ACTIVE_WORD_LIMIT);
    expect(result.pendingItems).toHaveLength(2);
    expect([...activeCardIds].every(cardId => !pendingCardIds.has(cardId))).toBe(true);
    expect(new Set([...activeCardIds, ...pendingCardIds]).size).toBe(reviewItems.length);
  });

  it('adds both directions of one pending word after an active word is completed', () => {
    const reviewItems = Array.from({ length: 12 }, (_, index) => buildSourceItem(index + 1));
    const result = buildRollingReviewQueue(reviewItems);
    const completedCardId = result.queue[0].cardId;
    const queueAfterCompletion = result.queue.filter(item => item.cardId !== completedCardId);
    const nextReviewItem = result.pendingItems[0];
    const replenishedQueue = addReviewWordToQueue(queueAfterCompletion, nextReviewItem);

    expect(new Set(replenishedQueue.map(item => item.cardId)).size).toBe(REVIEW_ACTIVE_WORD_LIMIT);
    expect(
      replenishedQueue
        .filter(item => item.cardId === nextReviewItem.id)
        .map(item => item.direction)
        .sort(),
    ).toEqual(['btf', 'ftb']);
  });

  it('adds only the required direction for a pending one-way card', () => {
    const oneWayItem = { ...buildSourceItem(20), studyDirection: 'ftb' as const };

    expect(addReviewWordToQueue([], oneWayItem).map(item => item.direction)).toEqual(['ftb']);
  });
});

describe('addFirstAttempt', () => {
  it('calculates first-try accuracy from one result per direction', () => {
    const initial = {
      totalDirections: 0,
      correctDirections: 0,
      accuracyPercentage: 0,
    };
    const afterCorrect = addFirstAttempt(initial, true);
    const afterMiss = addFirstAttempt(afterCorrect, false);

    expect(afterCorrect).toEqual({
      totalDirections: 1,
      correctDirections: 1,
      accuracyPercentage: 100,
    });
    expect(afterMiss).toEqual({
      totalDirections: 2,
      correctDirections: 1,
      accuracyPercentage: 50,
    });
  });
});
