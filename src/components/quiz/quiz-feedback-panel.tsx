'use client';

import { QuizFeedback } from '@/types/quiz.types';
import { Button, Card, Chip } from '@heroui/react';
import { useEffect } from 'react';
import AnswerRow from '@/components/quiz/answer-row';
import { QUIZ_FEEDBACK_STYLES } from '@/lib/study-colors';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

type WordCompletion = 'clean' | 'recovered';

type Props = {
  feedback: QuizFeedback;
  wordCompletion?: WordCompletion;
  onContinue: () => void;
  onAcceptAnyway?: () => void;
  keyboardShortcutEnabled?: boolean;
};

export default function QuizFeedbackPanel({
  feedback,
  wordCompletion,
  onContinue,
  onAcceptAnyway,
  keyboardShortcutEnabled = true,
}: Props) {
  const styles = feedback.isCorrect ? QUIZ_FEEDBACK_STYLES.correct : QUIZ_FEEDBACK_STYLES.incorrect;
  const completionStyles =
    wordCompletion === 'recovered' ? QUIZ_FEEDBACK_STYLES.incorrect : QUIZ_FEEDBACK_STYLES.correct;
  const completionSurface =
    wordCompletion === 'recovered'
      ? 'border-danger/60 bg-danger/25'
      : 'border-success/60 bg-success/25';
  useEffect(() => {
    if (!keyboardShortcutEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.isComposing) {
        return;
      }

      event.preventDefault();
      onContinue();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcutEnabled, onContinue]);

  return (
    <Card className={`border ${styles.surface}`}>
      <Card.Header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Card.Title render={props => <h2 {...props} />} className={styles.text}>
            {feedback.isCorrect ? 'Correct' : 'Not quite'}
          </Card.Title>
          <Card.Description>
            {feedback.isCorrect
              ? 'Good answer. Continue to the next card.'
              : 'Review the correct answer before continuing.'}
          </Card.Description>
        </div>

        <Chip size="sm" color="default" variant="soft">
          {feedback.quizItem.direction === 'btf' ? 'Back → Front' : 'Front → Back'}
        </Chip>
      </Card.Header>

      <Card.Content className="space-y-3">
        {wordCompletion ? (
          <div
            role="status"
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${completionSurface}`}
          >
            {wordCompletion === 'clean' ? (
              <CheckCircleIcon
                className={`mt-0.5 size-5 shrink-0 ${completionStyles.text}`}
                aria-hidden="true"
              />
            ) : (
              <ExclamationCircleIcon
                className={`mt-0.5 size-5 shrink-0 ${completionStyles.text}`}
                aria-hidden="true"
              />
            )}
            <div>
              <p className={`font-semibold ${completionStyles.text}`}>
                {wordCompletion === 'clean' ? 'Word complete' : 'Word complete - keep practicing'}
              </p>
              <p className="text-sm text-foreground/80">
                {wordCompletion === 'clean'
                  ? 'You passed both directions with no misses.'
                  : 'You passed both directions, but missed this word earlier.'}
              </p>
            </div>
          </div>
        ) : null}
        <AnswerRow
          label={feedback.quizItem.direction === 'btf' ? 'Back shown' : 'Front shown'}
          value={feedback.quizItem.prompt}
        />
        {feedback.quizItem.hint ? <AnswerRow label="Hint" value={feedback.quizItem.hint} /> : null}
        <AnswerRow label="Your answer" value={feedback.submittedAnswer.trim() || 'No answer'} />
        <AnswerRow
          label={feedback.quizItem.direction === 'btf' ? 'Correct front' : 'Correct back'}
          value={feedback.quizItem.answer}
        />
      </Card.Content>

      <Card.Footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {!feedback.isCorrect && onAcceptAnyway ? (
          <Button variant="secondary" onPress={onAcceptAnyway} className="w-full sm:w-auto">
            Accept anyway
          </Button>
        ) : null}
        <Button
          variant="primary"
          onPress={onContinue}
          className={`w-full sm:w-auto ${styles.button}`}
        >
          Continue
        </Button>
      </Card.Footer>
    </Card>
  );
}
