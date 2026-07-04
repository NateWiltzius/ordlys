export type QuizDirection = 'btf' | 'ftb';

export type QuizQueueItem = {
  cardId: number;
  direction: QuizDirection;
  prompt: string;
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
