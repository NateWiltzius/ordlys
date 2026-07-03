import { getDueReviewsForDeck, getNewVocabsForDeck } from '@/db/queries/review.queries';

export type ReviewCounts = {
  totalWords: number;
  newWordsAvailable: number;
  reviewsDue: number;
  wordsInReview: number;
};

export type LearnItem = Awaited<ReturnType<typeof getNewVocabsForDeck>>[number];
export type ReviewItem = Awaited<ReturnType<typeof getDueReviewsForDeck>>[number];
