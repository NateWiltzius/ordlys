import { getDueReviewsForDeck, getNewVocabsForDeck } from '@/db/queries/review.queries';

export type ReviewCounts = {
  totalWords: number;
  newWordsAvailable: number;
  reviewsDue: number;
  wordsInReview: number;
};

export type LessonProgress = {
  lessonId: number;
  lessonTitle: string;
  totalWords: number;
  learnedWords: number;
  masteredWords: number;
  requiredWords: number;
  isUnlocked: boolean;
};

export type LearnItem = Awaited<ReturnType<typeof getNewVocabsForDeck>>[number];
export type ReviewItem = Awaited<ReturnType<typeof getDueReviewsForDeck>>[number];
