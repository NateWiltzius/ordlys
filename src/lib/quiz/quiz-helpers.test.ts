import { describe, expect, it } from 'vitest';
import {
  addFirstAttempt,
  addReviewWordToQueue,
  buildQuizQueue,
  buildRollingReviewQueue,
  getQuizAttemptOutcome,
  REVIEW_ACTIVE_WORD_LIMIT,
} from './quiz-helpers';
import type { QuizSourceItem } from '@/types/quiz.types';

function buildSourceItem(id: number): QuizSourceItem {
  return {
    id,
    front: `term ${id}`,
    back: `meaning ${id}`,
    frontAlternatives: [],
    backAlternatives: [],
    frontToBackQuizHint: null,
    backToFrontQuizHint: null,
    reading: null,
    frontLanguage: null,
    backLanguage: null,
  };
}

describe('getQuizAttemptOutcome', () => {
  it('treats an automatically correct answer as accepted', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: true,
        wasOverridden: false,
        failedEarlier: false,
      }),
    ).toEqual({
      isAccepted: true,
      cardWasCorrect: true,
      shouldMarkMissed: false,
    });
  });

  it('treats an overridden answer as accepted for the session and SRS', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: false,
        wasOverridden: true,
        failedEarlier: false,
      }),
    ).toEqual({
      isAccepted: true,
      cardWasCorrect: true,
      shouldMarkMissed: false,
    });
  });

  it('does not erase a genuine earlier miss on the same card', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: false,
        wasOverridden: true,
        failedEarlier: true,
      }),
    ).toEqual({
      isAccepted: true,
      cardWasCorrect: false,
      shouldMarkMissed: false,
    });
  });

  it('marks a rejected answer as missed', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: false,
        wasOverridden: false,
        failedEarlier: false,
      }),
    ).toEqual({
      isAccepted: false,
      cardWasCorrect: false,
      shouldMarkMissed: true,
    });
  });
});

describe('buildQuizQueue', () => {
  it('keeps language-agnostic review context and vocabulary details in both directions', () => {
    const queue = buildQuizQueue([
      {
        id: 7,
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
      },
    ]);

    expect(queue).toHaveLength(2);
    expect(queue[0]).toMatchObject({
      prompt: 'meaning',
      acceptedAnswers: ['term', 'alternate term'],
      reading: 'reading',
      notes: 'Usage note',
      deckTitle: 'Deck',
      lessonTitle: 'Lesson',
      srsLevel: 2,
    });
    expect(queue[1]).toMatchObject({
      prompt: 'term',
      acceptedAnswers: ['meaning', 'alternate meaning'],
      reading: 'reading',
      notes: 'Usage note',
      deckTitle: 'Deck',
      lessonTitle: 'Lesson',
      srsLevel: 2,
    });
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
