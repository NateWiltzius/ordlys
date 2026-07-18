import { LearnItem } from '@/types/review.types';
import { Button, Card, Chip, ProgressBar } from '@heroui/react';
import { useState } from 'react';
import WordSide from '@/app/(protected)/decks/[deckId]/learn/_components/word-side';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { getLanguageName } from '@/lib/languages';

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
  const frontLanguage = getLanguageName(currentItem.frontLanguage);
  const backLanguage = getLanguageName(currentItem.backLanguage);
  const hasDetails = Boolean(currentItem.notes || currentItem.tags.length > 0);

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
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3 text-sm">
          <span className="min-w-0 break-words text-default-500">{currentItem.lessonTitle}</span>
          <span className="shrink-0 font-medium">
            {currentIndex + 1} / {learnItems.length}
          </span>
        </div>
        <ProgressBar aria-label="Learning progress" value={progress}>
          <ProgressBar.Track>
            <ProgressBar.Fill className={STUDY_TONE_STYLES.learning.progress} />
          </ProgressBar.Track>
        </ProgressBar>
      </div>

      <Card>
        <Card.Header>
          <Card.Title render={props => <h2 {...props} />}>New vocabulary</Card.Title>
          <Card.Description>Review the word and its meaning before the quiz.</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <WordSide
            label="Word"
            language={frontLanguage}
            value={currentItem.front}
            reading={currentItem.reading}
            alternatives={currentItem.frontAlternatives}
          />
          <WordSide
            label="Meaning"
            language={backLanguage}
            value={currentItem.back}
            alternatives={currentItem.backAlternatives}
            emphasis
          />

          {hasDetails ? (
            <section className="space-y-3 border-t border-default-200 pt-4">
              {currentItem.notes ? (
                <div>
                  <h3 className="text-sm font-semibold">Notes</h3>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-default-600">
                    {currentItem.notes}
                  </p>
                </div>
              ) : null}

              {currentItem.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2" aria-label="Vocabulary tags">
                  {currentItem.tags.map(tag => (
                    <Chip key={tag} size="sm" variant="soft">
                      {tag}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
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
          <Button
            variant="primary"
            className={`w-full ${STUDY_TONE_STYLES.learning.button}`}
            onPress={nextItemHandler}
          >
            {isLastItem ? 'Start quiz' : 'Next word'}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
