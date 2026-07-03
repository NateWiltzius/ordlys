import { LearnItem } from '@/types/review.types';
import { Button, Card } from '@heroui/react';
import { useState } from 'react';

type Props = {
  learnItems: LearnItem[];
  setModeHandler: (newMode: 'learn' | 'quiz') => void;
};

export default function LearnMode({ learnItems, setModeHandler }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = learnItems[currentIndex];

  const nextItemHandler = () => {
    setCurrentIndex(current => Math.min(current + 1, learnItems.length - 1));
    if (currentIndex === learnItems.length - 1) {
      setModeHandler('quiz');
    }
  };

  const previousItemHandler = () => {
    setCurrentIndex(current => Math.max(current - 1, 0));
  };

  return (
    <div>
      <Card>
        <Card.Header>
          <Card.Title>{currentItem.front}</Card.Title>
        </Card.Header>
        <Card.Content>{currentItem.back}</Card.Content>
      </Card>
      <Button onClick={previousItemHandler}>Previous</Button>
      <Button onClick={nextItemHandler}>Next</Button>
    </div>
  );
}
