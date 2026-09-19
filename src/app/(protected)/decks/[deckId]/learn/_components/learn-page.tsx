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
import ContinueToLesson from '@/components/shared/continue-to-lesson';
import DailyStudyTarget from '@/components/shared/daily-study-target';

type Props = {
  deckId: number;
  lessonId?: number;
  deckTitle: string;
  learnItems: LearnItem[];
  lessonProgress: LessonProgress[];
  selectedSize: number | 'all';
  availableCount: number;
  dailyProgress: { introducedToday: number; dailyNewWordTarget: number; timeZone: string };
};

export default function LearnPage({
  deckId,
  lessonId,
  deckTitle,
  learnItems,
  lessonProgress,
  selectedSize,
  availableCount,
  dailyProgress,
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
          title="Learn new cards"
          description={deckTitle}
          tone="learning"
          exitHref={`/decks/${deckId}`}
          exitLabel="Exit to deck"
        />
        <Card>
          <Card.Header>
            <Card.Title render={props => <h2 {...props} />}>
              {lessonId
                ? 'Lesson cards introduced'
                : nextLockedLesson
                  ? 'Keep reviewing to unlock more cards'
                  : 'All cards introduced'}
            </Card.Title>
            <Card.Description>
              {nextLockedLesson && previousLesson
                ? `You’ve introduced every available card. ${remainingRequired} more ${
                    remainingRequired === 1 ? 'card needs' : 'cards need'
                  } stronger recall in ${previousLesson.lessonTitle}.`
                : lessonId
                  ? 'You have added every card in this lesson to your review queue.'
                  : 'You have added every card in this deck to your review queue.'}
            </Card.Description>
          </Card.Header>
          <Card.Footer className="flex flex-wrap gap-3">
            <ButtonLink href={`/decks/${deckId}/review`}>Review now</ButtonLink>
            {lessonId ? (
              <ButtonLink href={`/decks/${deckId}`} variant="secondary">
                Back to lessons
              </ButtonLink>
            ) : null}
            {nextLockedLesson?.canContinueEarly ? (
              <ContinueToLesson deckId={deckId} lessonId={nextLockedLesson.lessonId} />
            ) : null}
            <ButtonLink href="/account" variant="secondary">
              Learning preferences
            </ButtonLink>
          </Card.Footer>
        </Card>
      </StudySession>
    );
  }

  return (
    <StudySession>
      <StudySessionHeader
        title={mode === 'quiz' ? 'Learning quiz' : 'Learn new cards'}
        description={`${deckTitle} · ${session.availableCount} new ${
          session.availableCount === 1 ? 'card' : 'cards'
        } available`}
        tone="learning"
        exitHref={`/decks/${deckId}`}
        exitLabel="Exit to deck"
      />
      {mode === 'learn' ? <DailyStudyTarget progress={dailyProgress} /> : null}
      {mode === 'learn' ? (
        <SessionSizePicker
          baseHref={`/decks/${deckId}/learn${lessonId ? `?lesson=${lessonId}` : ''}`}
          selectedSize={selectedSize}
          sizes={LEARN_SESSION_SIZES}
          totalCount={session.availableCount}
          noun="card"
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
