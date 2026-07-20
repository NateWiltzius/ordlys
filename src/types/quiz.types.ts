export type QuizDirection = 'btf' | 'ftb';

export type StudyMode = 'learn' | 'review' | 'placement';

export type SaveQuizAttemptInput = {
  vocabId: number;
  mode: StudyMode;
  direction: QuizDirection;
  isCorrect: boolean;
  wasOverridden: boolean;
  completesCard: boolean;
  cardWasCorrect: boolean;
  idempotencyKey: string;
};

export type QuizSourceItem = {
  id: number;
  front: string;
  back: string;
  frontAlternatives: string[];
  backAlternatives: string[];
  frontToBackQuizHint: string | null;
  backToFrontQuizHint: string | null;
  reading: string | null;
  notes?: string | null;
  frontLanguage: string | null;
  backLanguage: string | null;
  deckTitle?: string | null;
  lessonTitle?: string | null;
  srsLevel?: number | null;
};

export type QuizQueueItem = {
  cardId: number;
  direction: QuizDirection;
  prompt: string;
  hint: string | null;
  answer: string;
  acceptedAnswers: string[];
  frontLanguage: string | null;
  backLanguage: string | null;
  reading?: string | null;
  notes?: string | null;
  deckTitle?: string | null;
  lessonTitle?: string | null;
  srsLevel?: number | null;
};

export type QuizProgressItem = {
  cardId: number;
  btfPassed: boolean;
  ftbPassed: boolean;
};

export type QuizFeedback = {
  quizItem: QuizQueueItem;
  submittedAnswer: string;
  isCorrect: boolean;
};

export type QuizAttemptStats = {
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
};

export type QuizFirstAttemptStats = {
  totalDirections: number;
  correctDirections: number;
  accuracyPercentage: number;
};

export type QuizDifficultItem = {
  id: number;
  front: string;
  back: string;
  frontLanguage: string | null;
  backLanguage: string | null;
  deckTitle: string | null;
  lessonTitle: string | null;
  missCount: number;
};

export type QuizProgressStats = {
  totalCards: number;
  completedCards: number;
  remainingCards: number;
  passedDirections: number;
  totalDirections: number;
  progressPercentage: number;
  accuracyPercentage: number;
};

export type QuizProgress = Record<number, QuizProgressItem>;
