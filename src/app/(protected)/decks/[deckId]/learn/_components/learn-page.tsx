'use client';

import LearnMode from '@/app/(protected)/decks/[deckId]/learn/_components/learn-mode';
import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import { startVocabAction } from '@/server/review.actions';
import { LearnItem, LessonProgress } from '@/types/review.types';
import { Card } from '@heroui/react';
import { useState } from 'react';
import ButtonLink from '@/components/shared/button-link';
import { LESSON_PROGRESSION_CONFIG } from '@/lib/srs/srs-config';

type Props = {
  deckId: number;
  learnItems: LearnItem[];
  lessonProgress: LessonProgress[];
};

export default function LearnPage({ deckId, learnItems, lessonProgress }: Props) {
  const [mode, setMode] = useState<'learn' | 'quiz'>('learn');

  if (learnItems.length === 0) {
    const nextLockedLesson = lessonProgress.find(lesson => !lesson.isUnlocked);
    const previousLessons = nextLockedLesson
      ? lessonProgress.slice(0, lessonProgress.indexOf(nextLockedLesson))
      : [];
    const previousLesson = previousLessons.findLast(lesson => lesson.totalWords > 0);
    const remainingRequired = previousLesson
      ? Math.max(0, previousLesson.requiredWords - previousLesson.masteredWords)
      : 0;

    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <Card.Header>
            <Card.Title>
              {nextLockedLesson ? 'Keep reviewing to unlock more words' : 'All words learned'}
            </Card.Title>
            <Card.Description>
              {nextLockedLesson && previousLesson
                ? `${remainingRequired} more ${remainingRequired === 1 ? 'word needs' : 'words need'} to reach SRS level ${LESSON_PROGRESSION_CONFIG.unlockSrsLevel} in ${previousLesson.lessonTitle}.`
                : 'You have added every word in this deck to your review queue.'}
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <ButtonLink href={`/decks/${deckId}/review`}>Review now</ButtonLink>
          </Card.Footer>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{mode === 'quiz' ? 'Quiz' : 'Learn new words'}</h1>
      {mode === 'learn' ? (
        <LearnMode learnItems={learnItems} onStartQuiz={() => setMode('quiz')} />
      ) : (
        <QuizMode
          quizItems={learnItems}
          completionHref={`/decks/${deckId}`}
          onVocabComplete={async vocabId => {
            return await startVocabAction(vocabId);
          }}
        />
      )}
    </div>
  );
}
