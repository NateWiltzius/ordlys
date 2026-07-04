import { Button, Card, Chip, Input } from '@heroui/react';
import { FormEvent } from 'react';

type Props = {
  prompt: string;
  answer: string;
  direction: 'btf' | 'ftb';
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
};

export default function QuizAnswerForm({
  prompt,
  answer,
  direction,
  onAnswerChange,
  onSubmit,
}: Props) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card variant="secondary">
      <form onSubmit={handleSubmit}>
        <Card.Header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Card.Title>What does this mean?</Card.Title>
            <Card.Description>Type your answer, then submit.</Card.Description>
          </div>

          <Chip size="sm" variant="soft">
            {direction === 'btf' ? 'Back to front' : 'Front to back'}
          </Chip>
        </Card.Header>

        <Card.Content className="space-y-4">
          <div className="rounded-lg bg-default-100 px-4 py-6 text-center">
            <p className="text-2xl font-semibold">{prompt}</p>
          </div>

          <Input
            value={answer}
            onChange={e => onAnswerChange(e.target.value)}
            placeholder="Your answer"
            autoFocus
          />
        </Card.Content>

        <Card.Footer>
          <Button type="submit" variant="primary" className="w-full sm:w-auto">
            Submit answer
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
}
