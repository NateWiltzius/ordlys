import { LearnItem } from '@/types/review.types';
import { Button, Card, ProgressBar } from '@heroui/react';
import { useState } from 'react';
import WordSide from '@/app/(protected)/decks/[deckId]/learn/_components/word-side';

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
        <div className="flex items-start justify-between gap-3 text-sm">
          <span className="min-w-0 break-words text-default-500">{currentItem.lessonTitle}</span>
          <span className="shrink-0 font-medium">
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
        <Card.Footer className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            className="w-full"
            onPress={previousItemHandler}
            isDisabled={isFirstItem}
          >
            Previous
          </Button>
          <Button variant="primary" className="w-full" onPress={nextItemHandler}>
            {isLastItem ? 'Start quiz' : 'Next word'}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
