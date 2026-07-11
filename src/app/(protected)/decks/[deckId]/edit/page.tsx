import EditPage from '@/app/(protected)/decks/[deckId]/edit/_components/edit-page';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getEditDeckPageDataAction } from '@/server/deck.actions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit deck',
  description: 'Edit deck details, lessons, and vocabulary.',
};

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  const data = await getEditDeckPageDataAction(parsedDeckId);
  if (!data) notFound();
  const { deck, lessons, releases, hasUnpublishedChanges, provenance, removedDraftItems } = data;

  return (
    <EditPage
      deck={deck}
      releases={releases}
      hasUnpublishedChanges={hasUnpublishedChanges}
      provenance={provenance}
      removedDraftItems={removedDraftItems}
      lessons={lessons}
      parsedDeckId={parsedDeckId}
    />
  );
}
