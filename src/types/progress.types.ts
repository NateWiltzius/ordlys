import type { SrsCategoryCounts } from '@/lib/srs/srs-config';

export type ProgressActivityDay = {
  day: string;
  wordsPracticed: number;
  attempts: number;
  correctAttempts: number;
};

export type ProgressDeck = {
  id: number;
  title: string;
  totalWords: number;
  startedWords: number;
  reviewsDue: number;
  newWordsAvailable: number;
  srsCategoryCounts: SrsCategoryCounts;
  recentAttempts: number;
  recentCorrectAttempts: number;
};

export type ProgressPageData = {
  activity: ProgressActivityDay[];
  decks: ProgressDeck[];
  srsCategoryCounts: SrsCategoryCounts;
  totalWords: number;
  startedWords: number;
};
