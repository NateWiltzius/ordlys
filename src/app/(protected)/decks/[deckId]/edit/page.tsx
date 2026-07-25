import EditPage from '@/app/(protected)/decks/[deckId]/edit/_components/edit-page';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getEditDeckPageDataAction } from '@/server/deck.actions';
import type { Metadata } from 'next';
import { parseDeckEditorTab } from '@/lib/deck-editor-tabs';

export const metadata: Metadata = {
  title: 'Manage deck',
  description: 'Manage deck lessons, cards, and publishing.',
};

type Props = {
  params: Promise<{
    deckId: string;
  }>;
  searchParams: Promise<{
    tab?: string | string[];
  }>;
};

export default async function Page({ params, searchParams }: Props) {
  const [{ deckId }, query] = await Promise.all([params, searchParams]);
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
      initialTab={parseDeckEditorTab(query.tab)}
    />
  );
}
