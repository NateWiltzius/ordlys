import { QuizFeedback } from '@/types/quiz.types';
import { Button } from '@heroui/react';
import { useEffect } from 'react';

type Props = {
  feedback: QuizFeedback;
  isContinuing: boolean;
  onContinue: () => void;
};

export default function QuizFeedbackPanel({ feedback, isContinuing, onContinue }: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.isComposing || isContinuing) {
        return;
      }

      event.preventDefault();
      onContinue();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isContinuing, onContinue]);

  return (
    <div className="space-y-4">
      <div>
        <p className={feedback.isCorrect ? 'text-success' : 'text-danger'}>
          {feedback.isCorrect ? 'Correct' : 'Incorrect'}
        </p>

        <p>
          <strong>Prompt:</strong> {feedback.quizItem.prompt}
        </p>

        <p>
          <strong>Your answer:</strong> {feedback.submittedAnswer.trim() || <span>No answer</span>}
        </p>

        <p>
          <strong>Correct answer:</strong> {feedback.quizItem.answer}
        </p>

        <p>
          <strong>Direction:</strong>{' '}
          {feedback.quizItem.direction === 'btf' ? 'Back to front' : 'Front to back'}
        </p>
      </div>

      <Button onPress={onContinue} isPending={isContinuing}>
        Continue
      </Button>
    </div>
  );
}
