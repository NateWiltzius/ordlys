'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';

type PreviewCard = {
  id: number;
  front: string;
  back: string;
  reading: string | null;
};

type Props = {
  cards: PreviewCard[];
  frontLanguage: string | null;
  backLanguage: string | null;
};

export default function PublicDeckCardPreview({ cards, frontLanguage, backLanguage }: Props) {
  const previewCards = cards.slice(0, 5);
  const [cardIndex, setCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const card = previewCards[cardIndex];

  if (!card) return null;

  const showNextCard = () => {
    setCardIndex(index => (index + 1) % previewCards.length);
    setIsRevealed(false);
  };

  return (
    <section
      aria-labelledby="try-card-heading"
      className="rounded-xl border border-default-200 bg-default-50 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-4 border-b border-default-200 pb-4">
        <div>
          <h2 id="try-card-heading" className="text-lg font-semibold">
            Try a card
          </h2>
          <p className="mt-1 text-sm text-default-500">
            Reveal the answer to get a feel for this deck.
          </p>
        </div>
        <p className="shrink-0 text-sm text-default-500">
          {cardIndex + 1} of {previewCards.length}
        </p>
      </div>

      <div className="flex min-h-48 flex-col justify-center py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-default-500">Front</p>
        <p className="mt-2 text-2xl font-semibold" lang={frontLanguage ?? undefined}>
          {card.front}
        </p>
        {card.reading ? <p className="mt-2 text-sm text-default-500">{card.reading}</p> : null}

        {isRevealed ? (
          <div className="mt-7 border-t border-default-200 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-default-500">Back</p>
            <p className="mt-2 text-xl" lang={backLanguage ?? undefined}>
              {card.back}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex justify-center border-t border-default-200 pt-4">
        {isRevealed ? (
          <Button variant="secondary" onPress={showNextCard}>
            Next card
          </Button>
        ) : (
          <Button onPress={() => setIsRevealed(true)}>Reveal answer</Button>
        )}
      </div>
    </section>
  );
}
