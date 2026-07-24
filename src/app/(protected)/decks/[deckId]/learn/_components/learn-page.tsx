'use client';

import LearnMode from '@/app/(protected)/decks/[deckId]/learn/_components/learn-mode';
import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import { LearnItem, LessonProgress } from '@/types/review.types';
import { Card } from '@heroui/react';
import { useState } from 'react';
import ButtonLink from '@/components/shared/button-link';
import StudySession from '@/components/shared/layout/study-session';
import StudySessionHeader from '@/components/shared/layout/study-session-header';
import SessionSizePicker from '@/components/shared/session-size-picker';
import { LEARN_SESSION_SIZE_COOKIE, LEARN_SESSION_SIZES } from '@/lib/study-session-size';

type Props = {
  deckId: number;
  deckTitle: string;
  learnItems: LearnItem[];
  lessonProgress: LessonProgress[];
  selectedSize: number | 'all';
  availableCount: number;
};

export default function LearnPage({
  deckId,
  deckTitle,
  learnItems,
  lessonProgress,
  selectedSize,
  availableCount,
}: Props) {
  const [mode, setMode] = useState<'learn' | 'quiz'>('learn');
  // Learning answers also revalidate this route. Preserve the batch and progress
  // that belong to this session until its completion summary has been shown.
  const [startedSession, setStartedSession] = useState<{
    learnItems: LearnItem[];
    lessonProgress: LessonProgress[];
    availableCount: number;
  } | null>(null);
  const session = startedSession ?? { learnItems, lessonProgress, availableCount };

  if (session.learnItems.length === 0) {
    const nextLockedLesson = session.lessonProgress.find(lesson => !lesson.isUnlocked);
    const previousLessons = nextLockedLesson
      ? session.lessonProgress.slice(0, session.lessonProgress.indexOf(nextLockedLesson))
      : [];
    const previousLesson = previousLessons.findLast(lesson => lesson.totalWords > 0);
    const remainingRequired = previousLesson
      ? Math.max(0, previousLesson.requiredWords - previousLesson.learnedWords)
      : 0;

    return (
      <StudySession>
        <StudySessionHeader
          title="Learn new words"
          description={deckTitle}
          tone="learning"
          exitHref={`/decks/${deckId}`}
          exitLabel="Exit to deck"
        />
        <Card>
          <Card.Header>
            <Card.Title render={props => <h2 {...props} />}>
              {nextLockedLesson ? 'Keep reviewing to unlock more words' : 'All words introduced'}
            </Card.Title>
            <Card.Description>
              {nextLockedLesson && previousLesson
                ? `${remainingRequired} more ${
                    remainingRequired === 1 ? 'word needs' : 'words need'
                  } stronger recall in ${previousLesson.lessonTitle}.`
                : 'You have added every word in this deck to your review queue.'}
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <ButtonLink href={`/decks/${deckId}/review`}>Review now</ButtonLink>
          </Card.Footer>
        </Card>
      </StudySession>
    );
  }

  return (
    <StudySession>
      <StudySessionHeader
        title={mode === 'quiz' ? 'Learning quiz' : 'Learn new words'}
        description={`${deckTitle} · ${session.availableCount} new ${
          session.availableCount === 1 ? 'word' : 'words'
        } available`}
        tone="learning"
        exitHref={`/decks/${deckId}`}
        exitLabel="Exit to deck"
      />
      {mode === 'learn' ? (
        <SessionSizePicker
          baseHref={`/decks/${deckId}/learn`}
          selectedSize={selectedSize}
          sizes={LEARN_SESSION_SIZES}
          totalCount={session.availableCount}
          noun="word"
          allowAll
          preferenceCookieName={LEARN_SESSION_SIZE_COOKIE}
        />
      ) : null}
      {mode === 'learn' ? (
        <LearnMode
          key={selectedSize}
          learnItems={session.learnItems}
          onStartQuiz={() => {
            setStartedSession(current => current ?? session);
            setMode('quiz');
          }}
        />
      ) : (
        <QuizMode
          quizItems={session.learnItems}
          tone="learning"
          studyMode="learn"
          completionHref={`/decks/${deckId}`}
          reviewDeckId={deckId}
          showExitButton={false}
        />
      )}
    </StudySession>
  );
}
