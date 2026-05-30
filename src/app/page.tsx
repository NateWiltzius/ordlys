'use client';

import { createDeckAction, getDecksAction } from '@/server/deck.actions';
import { Deck } from '@/types/deck.types';
import { Button } from '@heroui/react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    const fetchDecks = async () => {
      const decks = await getDecksAction();
      setDecks(decks);
    };

    fetchDecks();
  }, []);

  const handleCreateDeck = async () => {
    await createDeckAction();
    const updatedDecks = await getDecksAction();
    setDecks(updatedDecks);
  };

  return (
    <div>
      <h1>Hello World</h1>
      <Button onClick={handleCreateDeck}>Hello HeroUI</Button>

      {decks.map(deck => (
        <div key={deck.id}>{deck.id + ' ' + deck.name}</div>
      ))}
    </div>
  );
}
