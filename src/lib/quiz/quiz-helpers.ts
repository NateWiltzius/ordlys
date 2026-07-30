import {
  QuizFirstAttemptStats,
  QuizDirection,
  QuizQueueItem,
  QuizProgress,
  QuizProgressItem,
  QuizSourceItem,
} from '@/types/quiz.types';
import type { DeckStudyDirection } from '@/lib/deck-study-direction';

export const REVIEW_ACTIVE_WORD_LIMIT = 10;

type RollingReviewQueue = {
  queue: QuizQueueItem[];
  pendingItems: QuizSourceItem[];
};

type QuizAttemptOutcomeInput = {
  isCorrect: boolean;
  wasOverridden: boolean;
};

type QuizAttemptOutcome = {
  isAccepted: boolean;
  shouldMarkMissed: boolean;
};

export function getQuizAttemptOutcome({
  isCorrect,
  wasOverridden,
}: QuizAttemptOutcomeInput): QuizAttemptOutcome {
  const isAccepted = isCorrect || wasOverridden;

  return {
    isAccepted,
    shouldMarkMissed: !isAccepted,
  };
}

export function addFirstAttempt(
  stats: QuizFirstAttemptStats,
  isCorrect: boolean,
): QuizFirstAttemptStats {
  const totalDirections = stats.totalDirections + 1;
  const correctDirections = stats.correctDirections + Number(isCorrect);

  return {
    totalDirections,
    correctDirections,
    accuracyPercentage: Math.round((correctDirections / totalDirections) * 100),
  };
}

export function getRequiredQuizDirections(studyDirection: DeckStudyDirection): QuizDirection[] {
  return studyDirection === 'both' ? ['btf', 'ftb'] : [studyDirection];
}

export function isQuizProgressComplete(
  progress: QuizProgressItem,
  studyDirection: DeckStudyDirection,
): boolean {
  return getRequiredQuizDirections(studyDirection).every(direction =>
    direction === 'btf' ? progress.btfPassed : progress.ftbPassed,
  );
}

export function buildQuizQueue(learnItems: QuizSourceItem[]): QuizQueueItem[] {
  return learnItems.flatMap(item => {
    const queueItems: Record<QuizDirection, QuizQueueItem> = {
      btf: {
        cardId: item.id,
        releaseId: item.releaseId,
        direction: 'btf',
        prompt: item.back,
        hint: item.backToFrontQuizHint,
        answer: item.front,
        acceptedAnswers: [item.front, ...item.frontAlternatives],
        frontLanguage: item.frontLanguage,
        backLanguage: item.backLanguage,
        reading: item.reading,
        notes: item.notes ?? null,
        deckTitle: item.deckTitle ?? null,
        lessonTitle: item.lessonTitle ?? null,
        srsLevel: item.srsLevel ?? null,
        studyDirection: item.studyDirection,
      },
      ftb: {
        cardId: item.id,
        releaseId: item.releaseId,
        direction: 'ftb',
        prompt: item.front,
        hint: item.frontToBackQuizHint,
        answer: item.back,
        acceptedAnswers: [item.back, ...item.backAlternatives],
        frontLanguage: item.frontLanguage,
        backLanguage: item.backLanguage,
        reading: item.reading,
        notes: item.notes ?? null,
        deckTitle: item.deckTitle ?? null,
        lessonTitle: item.lessonTitle ?? null,
        srsLevel: item.srsLevel ?? null,
        studyDirection: item.studyDirection,
      },
    };

    return getRequiredQuizDirections(item.studyDirection).map(direction => queueItems[direction]);
  });
}

export function buildQuizProgress(learnItems: QuizSourceItem[]): QuizProgress {
  return Object.fromEntries(
    learnItems.map(item => [
      item.id,
      {
        cardId: item.id,
        btfPassed: false,
        ftbPassed: false,
      },
    ]),
  );
}

export function buildRollingReviewQueue(
  reviewItems: QuizSourceItem[],
  activeWordLimit = REVIEW_ACTIVE_WORD_LIMIT,
): RollingReviewQueue {
  const randomizedItems = shuffleArray(reviewItems);
  const activeItems = randomizedItems.slice(0, activeWordLimit);

  return {
    queue: shuffleArray(buildQuizQueue(activeItems)),
    pendingItems: randomizedItems.slice(activeWordLimit),
  };
}

export function addReviewWordToQueue(
  queue: QuizQueueItem[],
  reviewItem: QuizSourceItem,
): QuizQueueItem[] {
  return shuffleArray(buildQuizQueue([reviewItem])).reduce(
    (nextQueue, queueItem) => insertLater(nextQueue, queueItem, 2),
    queue,
  );
}

export function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

export function insertLater<T>(items: T[], item: T, minDelay = 2): T[] {
  const queue = [...items];
  const minIndex = Math.min(minDelay, queue.length);
  const maxIndex = queue.length;
  const insertIndex = minIndex + Math.floor(Math.random() * (maxIndex - minIndex + 1));

  queue.splice(insertIndex, 0, item);

  return queue;
}
