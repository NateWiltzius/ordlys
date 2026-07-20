import {
  getDueReviewsForDeck,
  getNewVocabsForDeck,
  getPlacementTestVocabs,
} from '@/db/queries/review.queries';

export type ReviewCounts = {
  totalWords: number;
  newWordsAvailable: number;
  reviewsDue: number;
  wordsInReview: number;
};

export type ReviewForecast = {
  dueNow: number;
  hours: {
    hour: string;
    label: string;
    count: number;
  }[];
};

export type NextReviewBatch = {
  hour: string;
  count: number;
};

export type ReviewDeckDueCount = {
  deckId: number;
  deckTitle: string;
  count: number;
};

export type LessonProgress = {
  lessonId: number;
  lessonTitle: string;
  totalWords: number;
  introducedWords: number;
  learnedWords: number;
  requiredWords: number;
  isUnlocked: boolean;
  canTakePlacementTest: boolean;
};

export type SrsTransition = {
  previousLevel: number | null;
  nextLevel: number | null;
};

export type LearnItem = Awaited<ReturnType<typeof getNewVocabsForDeck>>[number];
export type ReviewItem = Awaited<ReturnType<typeof getDueReviewsForDeck>>[number];
export type PlacementTestItem = Awaited<ReturnType<typeof getPlacementTestVocabs>>[number];
