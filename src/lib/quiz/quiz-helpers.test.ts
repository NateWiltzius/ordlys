import { describe, expect, it } from 'vitest';
import { addFirstAttempt, buildQuizQueue, getQuizAttemptOutcome } from './quiz-helpers';

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
