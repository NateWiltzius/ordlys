import { LearnItem } from '@/types/review.types';
import { Button, Chip } from '@heroui/react';
import { useState } from 'react';
import WordSide from '@/app/(protected)/decks/[deckId]/learn/_components/word-side';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { getLanguageName } from '@/lib/languages';
import StudyProgress from '@/components/shared/study-progress';

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
    <div className="w-full space-y-4 pb-20 sm:pb-0">
      <StudyProgress
        label={
          <span
            className="line-clamp-2 min-w-0 break-words text-default-500"
            title={currentItem.lessonTitle}
          >
            {currentItem.lessonTitle}
          </span>
        }
        counter={
          <>
            {currentIndex + 1} / {learnItems.length}
          </>
        }
        value={progress}
        ariaLabel="Learning progress"
        tone="learning"
      />

      <article className="border-y border-default-200 px-1 py-7 sm:px-4 sm:py-9">
        <h2 className="sr-only">New cards</h2>
        <div>
          <WordSide
            label="Front"
            language={frontLanguage}
            value={currentItem.front}
            reading={currentItem.reading}
            alternatives={currentItem.frontAlternatives}
            primary
          />
          <WordSide
            label="Back"
            language={backLanguage}
            value={currentItem.back}
            alternatives={currentItem.backAlternatives}
          />

          {hasDetails ? (
            <section className="mt-7 space-y-3 border-t border-default-200 pt-5 text-left">
              {currentItem.notes ? (
                <div>
                  <h3 className="text-sm font-semibold">Notes</h3>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-default-600">
                    {currentItem.notes}
                  </p>
                </div>
              ) : null}

              {currentItem.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2" aria-label="Card tags">
                  {currentItem.tags.map(tag => (
                    <Chip key={tag} size="sm" variant="soft">
                      {tag}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-default-200 bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
        <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-3">
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
            {isLastItem ? 'Start quiz' : 'Next card'}
          </Button>
        </div>
      </div>
    </div>
  );
}
