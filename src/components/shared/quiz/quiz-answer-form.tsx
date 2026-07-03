import { Button, Input } from '@heroui/react';
import { FormEvent } from 'react';

type Props = {
  prompt: string;
  answer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
};

export default function QuizAnswerForm({ prompt, answer, onAnswerChange, onSubmit }: Props) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p>{prompt}</p>

      <Input
        value={answer}
        onChange={e => onAnswerChange(e.target.value)}
        placeholder="Your answer"
        autoFocus
      />

      <Button type="submit">Submit</Button>
    </form>
  );
}
