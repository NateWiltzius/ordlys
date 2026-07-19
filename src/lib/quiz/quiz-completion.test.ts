import { describe, expect, it } from 'vitest';
import { getQuizCompletionContent } from './quiz-completion';

describe('getQuizCompletionContent', () => {
  it('describes newly introduced words after learning', () => {
    expect(
      getQuizCompletionContent({
        studyMode: 'learn',
        recordAttempts: true,
        completedCards: 3,
        totalCards: 3,
        missedCardCount: 1,
      }),
    ).toMatchObject({
      title: 'Learning complete',
      completedLabel: 'New words',
      detail: '1 word needed another try before completion.',
    });
  });

  it('describes a scheduled review', () => {
    expect(
      getQuizCompletionContent({
        studyMode: 'review',
        recordAttempts: true,
        completedCards: 5,
        totalCards: 5,
        missedCardCount: 0,
      }),
    ).toMatchObject({
      title: 'Review complete',
      completedLabel: 'Cards reviewed',
      detail: 'Every card was completed without a miss.',
    });
  });

  it('keeps unscheduled practice distinct from review', () => {
    expect(
      getQuizCompletionContent({
        studyMode: 'review',
        recordAttempts: false,
        completedCards: 4,
        totalCards: 4,
        missedCardCount: 0,
      }),
    ).toMatchObject({
      title: 'Practice complete',
      completedLabel: 'Cards practiced',
    });
  });

  it('reports clean placement passes separately from tested words', () => {
    expect(
      getQuizCompletionContent({
        studyMode: 'placement',
        recordAttempts: true,
        completedCards: 6,
        totalCards: 6,
        missedCardCount: 2,
      }),
    ).toMatchObject({
      title: 'Placement test complete',
      completedLabel: 'Words tested',
      detail: '4 of 6 words passed without a miss and qualified for placement.',
    });
  });
});
