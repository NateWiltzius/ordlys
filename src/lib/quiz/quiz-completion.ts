import type { StudyMode } from '@/types/quiz.types';

type QuizCompletionInput = {
  studyMode: StudyMode;
  recordAttempts: boolean;
  completedCards: number;
  totalCards: number;
  missedCardCount: number;
};

export type QuizCompletionContent = {
  title: string;
  description: string;
  completedLabel: string;
  detail: string | null;
};

export function getQuizCompletionContent({
  studyMode,
  recordAttempts,
  completedCards,
  totalCards,
  missedCardCount,
}: QuizCompletionInput): QuizCompletionContent {
  if (!recordAttempts) {
    return {
      title: 'Practice complete',
      description: `You revisited ${completedCards} ${
        completedCards === 1 ? 'card' : 'cards'
      } without changing your review schedule.`,
      completedLabel: 'Cards practiced',
      detail:
        missedCardCount > 0
          ? `${missedCardCount} ${
              missedCardCount === 1 ? 'card needed' : 'cards needed'
            } another try.`
          : 'Every card was completed without a miss.',
    };
  }

  if (studyMode === 'learn') {
    return {
      title: 'Learning complete',
      description: `${completedCards} new ${
        completedCards === 1 ? 'word is' : 'words are'
      } now in your review queue.`,
      completedLabel: 'New words',
      detail:
        missedCardCount > 0
          ? `${missedCardCount} ${
              missedCardCount === 1 ? 'word needed' : 'words needed'
            } another try before completion.`
          : 'Every word was completed without a miss.',
    };
  }

  if (studyMode === 'placement') {
    const cleanPasses = Math.max(0, totalCards - missedCardCount);

    return {
      title: 'Placement test complete',
      description: `You tested ${completedCards} ${
        completedCards === 1 ? 'word' : 'words'
      } in both directions.`,
      completedLabel: 'Words tested',
      detail: `${cleanPasses} of ${totalCards} ${
        totalCards === 1 ? 'word passed' : 'words passed'
      } without a miss and qualified for placement.`,
    };
  }

  return {
    title: 'Review complete',
    description: 'Your answers are saved and your review schedule is up to date.',
    completedLabel: 'Cards reviewed',
    detail:
      missedCardCount > 0
        ? `${missedCardCount} ${
            missedCardCount === 1 ? 'card needed' : 'cards needed'
          } another try before completion.`
        : 'Every card was completed without a miss.',
  };
}
