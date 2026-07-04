import { QuizFeedback } from '@/types/quiz.types';
import { Button, Card, Chip } from '@heroui/react';
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

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isContinuing, onContinue]);

  return (
    <Card variant={feedback.isCorrect ? 'tertiary' : 'secondary'}>
      <Card.Header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Card.Title>{feedback.isCorrect ? 'Correct' : 'Not quite'}</Card.Title>
          <Card.Description>
            {feedback.isCorrect
              ? 'Good answer. Continue to the next card.'
              : 'Review the correct answer before continuing.'}
          </Card.Description>
        </div>

        <Chip size="sm" color={feedback.isCorrect ? 'success' : 'danger'} variant="soft">
          {feedback.quizItem.direction === 'btf' ? 'Back to front' : 'Front to back'}
        </Chip>
      </Card.Header>

      <Card.Content className="space-y-3">
        <AnswerRow label="Prompt" value={feedback.quizItem.prompt} />
        <AnswerRow label="Your answer" value={feedback.submittedAnswer.trim() || 'No answer'} />
        <AnswerRow label="Correct answer" value={feedback.quizItem.answer} />
      </Card.Content>

      <Card.Footer>
        <Button
          variant="primary"
          onPress={onContinue}
          isPending={isContinuing}
          className="w-full sm:w-auto"
        >
          Continue
        </Button>
      </Card.Footer>
    </Card>
  );
}

function AnswerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-default-100 px-4 py-3">
      <p className="text-sm text-default-500">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
