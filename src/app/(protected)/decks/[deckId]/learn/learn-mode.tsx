import { LearnItem } from '@/types/review.types';
import { Button, Card, ProgressBar } from '@heroui/react';
import { useState } from 'react';

type Props = {
  learnItems: LearnItem[];
  onStartQuiz: () => void;
};

export default function LearnMode({ learnItems, onStartQuiz }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = learnItems[currentIndex];
  const isFirstItem = currentIndex === 0;
  const isLastItem = currentIndex === learnItems.length - 1;
  const progress = ((currentIndex + 1) / learnItems.length) * 100;

  const nextItemHandler = () => {
    if (isLastItem) {
      onStartQuiz();
      return;
    }

    setCurrentIndex(current => current + 1);
  };

  const previousItemHandler = () => {
    setCurrentIndex(current => Math.max(current - 1, 0));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-default-500">{currentItem.lessonTitle}</span>
          <span className="font-medium">
            {currentIndex + 1} / {learnItems.length}
          </span>
        </div>
        <ProgressBar aria-label="Learning progress" value={progress} color="success">
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>New word</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <WordSide label="Front" value={currentItem.front} reading={currentItem.reading} />
          <WordSide label="Back" value={currentItem.back} />
        </Card.Content>
        <Card.Footer className="flex justify-between gap-3">
          <Button variant="secondary" onPress={previousItemHandler} isDisabled={isFirstItem}>
            Previous
          </Button>
          <Button variant="primary" onPress={nextItemHandler}>
            {isLastItem ? 'Start quiz' : 'Next word'}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}

function WordSide({
  label,
  value,
  reading,
}: {
  label: string;
  value: string;
  reading?: string | null;
}) {
  return (
    <div className="rounded-lg bg-default-100 px-4 py-5">
      <p className="text-xs font-medium uppercase tracking-wide text-default-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {reading ? <p className="mt-1 text-sm text-default-500">{reading}</p> : null}
    </div>
  );
}
