import { QuizFeedback } from '@/types/quiz.types';
import { Button, Card, Chip } from '@heroui/react';
import { useEffect } from 'react';
import AnswerRow from '@/app/(protected)/decks/[deckId]/_components/quiz/answer-row';

type Props = {
  feedback: QuizFeedback;
  onContinue: () => void;
};

export default function QuizFeedbackPanel({ feedback, onContinue }: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.isComposing) {
        return;
      }

      event.preventDefault();
      onContinue();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue]);

  return (
    <Card className={feedback.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}>
      <Card.Header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Card.Title>{feedback.isCorrect ? 'Correct' : 'Not quite'}</Card.Title>
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
        <AnswerRow
          label={feedback.quizItem.direction === 'btf' ? 'Back shown' : 'Front shown'}
          value={feedback.quizItem.prompt}
        />
        <AnswerRow label="Your answer" value={feedback.submittedAnswer.trim() || 'No answer'} />
        <AnswerRow
          label={feedback.quizItem.direction === 'btf' ? 'Correct front' : 'Correct back'}
          value={feedback.quizItem.answer}
        />
      </Card.Content>

      <Card.Footer>
        <Button variant="primary" onPress={onContinue} className="w-full sm:w-auto">
          Continue
        </Button>
      </Card.Footer>
    </Card>
  );
}
