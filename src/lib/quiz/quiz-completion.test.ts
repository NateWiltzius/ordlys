import { describe, expect, it } from 'vitest';
import {
  getDifficultQuizItems,
  getMilestoneSummary,
  getQuizCompletionContent,
  getSrsMilestoneCounts,
} from './quiz-completion';

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
      cleanLabel: 'Learned cleanly',
      detail: 'Every new word is now in review; missed words needed another pass in this session.',
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
      cleanLabel: 'Strengthened',
      detail: 'Every card passed cleanly and was scheduled further ahead.',
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
      cleanLabel: 'Clean passes',
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
      cleanLabel: 'Qualified',
      detail: '4 of 6 words passed without a miss and qualified for placement.',
    });
  });

  it('describes one-way placement without claiming both directions were tested', () => {
    expect(
      getQuizCompletionContent({
        studyMode: 'placement',
        recordAttempts: true,
        completedCards: 2,
        totalCards: 2,
        missedCardCount: 0,
        usesOneWayCards: true,
      }).description,
    ).toBe('You tested 2 words in each deck’s required direction.');
  });
});

describe('getDifficultQuizItems', () => {
  const quizItems = [
    {
      id: 1,
      releaseId: 1,
      front: 'one',
      back: 'first',
      frontAlternatives: [],
      backAlternatives: [],
      frontToBackQuizHint: null,
      backToFrontQuizHint: null,
      reading: null,
      frontLanguage: 'one',
      backLanguage: 'two',
      deckTitle: 'Deck',
      lessonTitle: 'Lesson',
      studyDirection: 'both' as const,
    },
    {
      id: 2,
      releaseId: 1,
      front: 'two',
      back: 'second',
      frontAlternatives: [],
      backAlternatives: [],
      frontToBackQuizHint: null,
      backToFrontQuizHint: null,
      reading: null,
      frontLanguage: 'one',
      backLanguage: 'two',
      deckTitle: 'Deck',
      lessonTitle: 'Lesson',
      studyDirection: 'both' as const,
    },
    {
      id: 3,
      releaseId: 1,
      front: 'three',
      back: 'third',
      frontAlternatives: [],
      backAlternatives: [],
      frontToBackQuizHint: null,
      backToFrontQuizHint: null,
      reading: null,
      frontLanguage: 'one',
      backLanguage: 'two',
      deckTitle: 'Deck',
      lessonTitle: 'Lesson',
      studyDirection: 'both' as const,
    },
  ];

  it('ranks missed words by miss frequency and applies the limit', () => {
    expect(getDifficultQuizItems(quizItems, { 1: 1, 2: 3, 3: 2 }, 2)).toEqual([
      expect.objectContaining({ id: 2, missCount: 3 }),
      expect.objectContaining({ id: 3, missCount: 2 }),
    ]);
  });
});

describe('SRS milestone summaries', () => {
  it('counts category thresholds crossed by saved transitions', () => {
    const counts = getSrsMilestoneCounts([
      { previousLevel: 2, nextLevel: 3 },
      { previousLevel: 5, nextLevel: 6 },
      { previousLevel: 7, nextLevel: 8 },
      { previousLevel: 4, nextLevel: 3 },
    ]);

    expect(counts).toEqual({ strong: 1, mature: 1, mastered: 1 });
    expect(getMilestoneSummary(counts)).toBe(
      '1 word reached Strong · 1 word reached Mature · 1 word reached Mastered.',
    );
  });

  it('omits the milestone message when no threshold was crossed', () => {
    expect(getMilestoneSummary({ strong: 0, mature: 0, mastered: 0 })).toBeNull();
  });
});
