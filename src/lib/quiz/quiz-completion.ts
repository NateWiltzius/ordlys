import type { QuizDifficultItem, QuizSourceItem, StudyMode } from '@/types/quiz.types';
import type { SrsTransition } from '@/types/review.types';

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
  cleanLabel: string;
  missedLabel: string;
  detail: string | null;
};

export type SrsMilestoneCounts = {
  strong: number;
  mature: number;
  mastered: number;
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
      cleanLabel: 'Clean passes',
      missedLabel: 'Needed another pass',
      detail:
        missedCardCount > 0
          ? 'You completed every card; missed words stayed in this practice session until they were passed.'
          : 'Every card passed on the first try.',
    };
  }

  if (studyMode === 'learn') {
    return {
      title: 'Learning complete',
      description: `${completedCards} new ${
        completedCards === 1 ? 'word is' : 'words are'
      } now in your review queue.`,
      completedLabel: 'New words',
      cleanLabel: 'Learned cleanly',
      missedLabel: 'Needed another pass',
      detail:
        missedCardCount > 0
          ? 'Every new word is now in review; missed words will return sooner.'
          : 'Every new word passed cleanly and is now in review.',
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
      cleanLabel: 'Qualified',
      missedLabel: 'Did not qualify',
      detail: `${cleanPasses} of ${totalCards} ${
        totalCards === 1 ? 'word passed' : 'words passed'
      } without a miss and qualified for placement.`,
    };
  }

  return {
    title: 'Review complete',
    description: 'Your answers are saved and your review schedule is up to date.',
    completedLabel: 'Cards reviewed',
    cleanLabel: 'Strengthened',
    missedLabel: 'Needed another pass',
    detail:
      missedCardCount > 0
        ? 'Missed words were scheduled sooner so they can be reinforced.'
        : 'Every card passed cleanly and was scheduled further ahead.',
  };
}

export function getDifficultQuizItems(
  quizItems: QuizSourceItem[],
  missCounts: Record<number, number>,
  limit = 3,
): QuizDifficultItem[] {
  return quizItems
    .map((item, index) => ({ item, index, missCount: missCounts[item.id] ?? 0 }))
    .filter(item => item.missCount > 0)
    .sort((left, right) => right.missCount - left.missCount || left.index - right.index)
    .slice(0, Math.max(0, limit))
    .map(({ item, missCount }) => ({
      id: item.id,
      front: item.front,
      back: item.back,
      frontLanguage: item.frontLanguage,
      backLanguage: item.backLanguage,
      deckTitle: item.deckTitle ?? null,
      lessonTitle: item.lessonTitle ?? null,
      missCount,
    }));
}

export function getSrsMilestoneCounts(transitions: SrsTransition[]): SrsMilestoneCounts {
  return transitions.reduce<SrsMilestoneCounts>(
    (counts, transition) => {
      if (transition.nextLevel === null) return counts;
      const previousLevel = transition.previousLevel ?? -1;

      if (previousLevel < 3 && transition.nextLevel >= 3) counts.strong += 1;
      if (previousLevel < 6 && transition.nextLevel >= 6) counts.mature += 1;
      if (previousLevel < 8 && transition.nextLevel >= 8) counts.mastered += 1;

      return counts;
    },
    { strong: 0, mature: 0, mastered: 0 },
  );
}

export function getMilestoneSummary(milestones: SrsMilestoneCounts): string | null {
  const parts = [
    milestones.strong > 0
      ? `${milestones.strong} ${milestones.strong === 1 ? 'word reached' : 'words reached'} Strong`
      : null,
    milestones.mature > 0
      ? `${milestones.mature} ${milestones.mature === 1 ? 'word reached' : 'words reached'} Mature`
      : null,
    milestones.mastered > 0
      ? `${milestones.mastered} ${milestones.mastered === 1 ? 'word reached' : 'words reached'} Mastered`
      : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? `${parts.join(' · ')}.` : null;
}
