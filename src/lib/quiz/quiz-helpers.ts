import { QuizQueueItem, QuizProgress } from '@/types/quiz.types';
import { LearnItem, ReviewItem } from '@/types/review.types';

export function buildQuizQueue(learnItems: LearnItem[] | ReviewItem[]): QuizQueueItem[] {
  return learnItems.flatMap(item => [
    {
      cardId: item.id,
      direction: 'btf',
      prompt: item.back,
      answer: item.front,
      acceptedAnswers: [item.front, ...item.frontAlternatives],
    },
    {
      cardId: item.id,
      direction: 'ftb',
      prompt: item.front,
      answer: item.back,
      acceptedAnswers: [item.back, ...item.backAlternatives],
    },
  ]);
}

export function buildQuizProgress(learnItems: LearnItem[] | ReviewItem[]): QuizProgress {
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
