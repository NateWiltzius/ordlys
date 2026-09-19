import { notFound } from 'next/navigation';
import { getCachedDeckPageIdentity } from '../_lib/get-cached-deck-page-data';
import { getProtectedDeckFollowerCount } from '@/db/queries/deck-release.queries';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import DeckDeletion from './deck-deletion';

export const metadata = { title: 'Delete deck' };

export default async function Page({ params }: { params: Promise<{ deckId: string }> }) {
  const deckId = parsePositiveInteger((await params).deckId);
  if (!deckId) notFound();
  const data = await getCachedDeckPageIdentity(deckId);
  if (!data?.isOwned || data.deck.status === 'moderation_removed') notFound();

  return (
    <DeckDeletion
      deck={data.deck}
      protectedFollowerCount={await getProtectedDeckFollowerCount(deckId)}
    />
  );
}
