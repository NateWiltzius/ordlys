import type { StudyMode } from '@/types/quiz.types';

export type WordCompletion = 'clean' | 'recovered';

export type WordCompletionContent = {
  title: string;
  description: string;
  isWarning: boolean;
};

export function getWordCompletionContent(
  studyMode: StudyMode,
  wordCompletion: WordCompletion,
): WordCompletionContent {
  if (studyMode === 'learn') {
    return {
      title: 'Word complete',
      description: 'Both directions passed. This word will start at Learning 1.',
      isWarning: false,
    };
  }

  if (studyMode === 'placement') {
    return wordCompletion === 'clean'
      ? {
          title: 'Placement passed',
          description:
            'You passed both directions without a miss. This word will be marked as learned.',
          isWarning: false,
        }
      : {
          title: 'Placement not passed',
          description:
            'You completed both directions, but an earlier miss means this word will stay in the normal learning flow.',
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
        title: 'Word complete - keep practicing',
        description: 'You passed both directions, but missed this word earlier.',
        isWarning: true,
      };
}
