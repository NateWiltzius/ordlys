import type { StudyMode } from '@/types/quiz.types';
import { getSrsLevelDisplayLabel, PLACEMENT_TEST_CONFIG } from '../srs/srs-config';
import { getInitialSrsState, getNextSrsState, getSrsStateForLevel } from '../srs/srs-scheduler';

export type WordCompletion = 'clean' | 'recovered';

type WordCompletionContent = {
  title: string;
  description: string;
  isWarning: boolean;
};

function formatReviewInterval(intervalMinutes: number): string {
  if (intervalMinutes < 60) return `${intervalMinutes} minutes`;
  if (intervalMinutes < 24 * 60) {
    const hours = intervalMinutes / 60;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  const days = intervalMinutes / (24 * 60);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'}`;
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  return `${days} days`;
}

export function getWordCompletionContent(
  studyMode: StudyMode,
  wordCompletion: WordCompletion,
  currentSrsLevel: number | null = null,
  recordAttempts = true,
): WordCompletionContent {
  if (!recordAttempts) {
    return {
      title: 'Practice complete',
      description:
        wordCompletion === 'clean'
          ? 'You passed both directions. Optional practice does not change the review schedule.'
          : 'You passed both directions after an earlier miss. Optional practice does not change the review schedule.',
      isWarning: wordCompletion === 'recovered',
    };
  }

  if (studyMode === 'learn') {
    const nextState = getInitialSrsState();
    return {
      title: 'Word complete',
      description: `Both directions passed. This word will start at Learning 1 and return in ${formatReviewInterval(nextState.intervalMinutes)}.`,
      isWarning: false,
    };
  }

  if (studyMode === 'placement') {
    const nextState = getSrsStateForLevel(PLACEMENT_TEST_CONFIG.passedSrsLevel);
    return wordCompletion === 'clean'
      ? {
          title: 'Placement passed',
          description: `You passed both directions without a miss. This word will start at ${getSrsLevelDisplayLabel(nextState.srsLevel)} and return in ${formatReviewInterval(nextState.intervalMinutes)}.`,
          isWarning: false,
        }
      : {
          title: 'Placement not passed',
          description:
            'You completed both directions, but an earlier miss means this word will stay in the normal learning flow.',
          isWarning: true,
        };
  }

  if (currentSrsLevel !== null) {
    const nextState = getNextSrsState({
      currentSrsLevel,
      wasCorrect: wordCompletion === 'clean',
    });
    const currentLevelLabel = getSrsLevelDisplayLabel(currentSrsLevel);
    const nextLevelLabel = getSrsLevelDisplayLabel(nextState.srsLevel);
    const levelChanged = nextState.srsLevel !== currentSrsLevel;
    const transition = levelChanged
      ? `${currentLevelLabel} → ${nextLevelLabel}`
      : `Stays at ${currentLevelLabel}`;

    return wordCompletion === 'clean'
      ? {
          title: levelChanged ? 'Review level increased' : 'Review level unchanged',
          description: `${transition}. Next review in ${formatReviewInterval(nextState.intervalMinutes)}.`,
          isWarning: false,
        }
      : {
          title: levelChanged ? 'Review level decreased' : 'Review level unchanged',
          description: levelChanged
            ? `An earlier miss lowered the review level: ${transition}. Next review in ${formatReviewInterval(nextState.intervalMinutes)}.`
            : `An earlier miss prevented this word from advancing. ${transition}. Next review in ${formatReviewInterval(nextState.intervalMinutes)}.`,
          isWarning: true,
        };
  }

  return wordCompletion === 'clean'
    ? {
        title: 'Word complete',
        description: 'You passed both directions with no misses.',
        isWarning: false,
      }
    : {
        title: 'Word completed after a miss',
        description: 'You passed both directions, but missed this word earlier.',
        isWarning: true,
      };
}

export function getDirectionProgressContent(isCorrect: boolean, recordAttempts = true) {
  if (!recordAttempts) {
    return {
      title: isCorrect ? 'Direction passed' : 'Try this direction again',
      description: isCorrect
        ? 'Pass the other direction to complete this practice word. Your review schedule will not change.'
        : 'This direction will return later in this practice session. Your review schedule will not change.',
      isWarning: !isCorrect,
    };
  }

  return {
    title: isCorrect ? 'One direction passed' : 'Try this direction again',
    description: isCorrect
      ? 'Pass the other direction to complete this word and update its review schedule.'
      : "This direction will return later in the session. The word's review schedule updates after both directions are passed.",
    isWarning: !isCorrect,
  };
}
