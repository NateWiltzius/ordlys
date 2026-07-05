import { Button, Card, Chip, Input } from '@heroui/react';
import { FormEvent } from 'react';
import { STUDY_TONE_STYLES, StudyTone } from '@/lib/study-colors';

type Props = {
  prompt: string;
  answer: string;
  direction: 'btf' | 'ftb';
  tone: StudyTone;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
};

export default function QuizAnswerForm({
  prompt,
  answer,
  direction,
  tone,
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
            <Card.Title>Recall the {direction === 'btf' ? 'front' : 'back'}</Card.Title>
            <Card.Description>
              You are shown the {direction === 'btf' ? 'back' : 'front'} side.
            </Card.Description>
          </div>

          <Chip size="sm" variant="soft">
            {direction === 'btf' ? 'Back → Front' : 'Front → Back'}
          </Chip>
        </Card.Header>

        <Card.Content className="space-y-4">
          <div className="rounded-lg bg-default-100 px-4 py-6 text-center">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-default-500">
              {direction === 'btf' ? 'Back' : 'Front'}
            </p>
            <p className="break-words text-2xl font-semibold">{prompt}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Answer with the {direction === 'btf' ? 'front' : 'back'}
            </p>
            <Input
              aria-label={`Answer with the ${direction === 'btf' ? 'front' : 'back'}`}
              value={answer}
              onChange={e => onAnswerChange(e.target.value)}
              placeholder="Your answer"
              autoFocus
              fullWidth
            />
          </div>
        </Card.Content>

        <Card.Footer>
          <Button
            type="submit"
            variant="primary"
            className={`mt-4 w-full sm:w-auto ${STUDY_TONE_STYLES[tone].button}`}
          >
            Submit answer
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
}
