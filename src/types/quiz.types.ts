type QuizDirection = 'btf' | 'ftb';

export type QuizSourceItem = {
  id: number;
  front: string;
  back: string;
  frontAlternatives: string[];
  backAlternatives: string[];
  frontToBackQuizHint: string | null;
  backToFrontQuizHint: string | null;
  frontLanguage: string | null;
  backLanguage: string | null;
};

export type QuizQueueItem = {
  cardId: number;
  direction: QuizDirection;
  prompt: string;
  hint: string | null;
  answer: string;
  acceptedAnswers: string[];
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
