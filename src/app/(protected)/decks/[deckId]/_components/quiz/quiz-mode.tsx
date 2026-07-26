'use client';

import type { StudyTone } from '@/lib/study-colors';
import type { QuizSourceItem, StudyMode } from '@/types/quiz.types';
import QuizModeView from './quiz-mode-view';
import { useQuizModeController } from './use-quiz-mode-controller';

type Props = {
  quizItems: QuizSourceItem[];
  completionHref: string;
  tone?: StudyTone;
  allowAnswerOverride?: boolean;
  studyMode: StudyMode;
  recordAttempts?: boolean;
  onSessionStart?: () => void;
  reviewDeckId?: number;
  showExitButton?: boolean;
};

export default function QuizMode({
  quizItems,
  completionHref,
  tone = 'neutral',
  allowAnswerOverride = true,
  studyMode,
  recordAttempts = true,
  onSessionStart,
  reviewDeckId,
  showExitButton = true,
}: Props) {
  const controller = useQuizModeController({
    quizItems,
    studyMode,
    recordAttempts,
    onSessionStart,
    reviewDeckId,
  });

  return (
    <QuizModeView
      controller={controller}
      completionHref={completionHref}
      tone={tone}
      allowAnswerOverride={allowAnswerOverride}
      studyMode={studyMode}
      recordAttempts={recordAttempts}
      showExitButton={showExitButton}
    />
  );
}
