import PageHeader from '@/components/shared/layout/page-header';
import type { Deck } from '@/types/deck.types';
import RestoreDeckButton from './restore-deck-button';
import ButtonLink from '@/components/shared/button-link';
import { formatLanguagePair } from '@/lib/languages';
import DeckIdentity from '@/components/shared/deck-identity';
import type { DeckBadgeKind } from '@/components/shared/deck-badge';
import {
  DeckHeaderSafetyControls,
  DeckHeaderStatusDetails,
} from '@/app/(protected)/decks/[deckId]/_components/deck-header-server-content';
import { Suspense } from 'react';
import { SkeletonBlock } from '@/components/shared/skeleton';

type Props = {
  deck: Deck;
  isOwned: boolean;
  isFollowing: boolean;
};

export default function DeckHeader({ deck, isOwned, isFollowing }: Props) {
  const identityBadges: DeckBadgeKind[] = [];
  if (isOwned) identityBadges.push(deck.sourceReleaseId ? 'copy' : 'owned');
  else if (isFollowing) identityBadges.push('following');

  if (deck.status === 'active') {
    identityBadges.push(deck.visibility);
  } else if (isOwned) {
    identityBadges.push(deck.status === 'deleted' ? 'deletion-pending' : 'archived');
  } else {
    identityBadges.push(deck.status === 'deleted' ? 'source-deletion-pending' : 'source-archived');
  }

  return (
    <PageHeader
      title={deck.title}
      description={deck.description || 'No description provided.'}
      backLink={
        isOwned || isFollowing
          ? { href: '/decks', label: 'Back to Library' }
          : { href: '/discover', label: 'Back to Discover' }
      }
      contentClassName="flex-col items-stretch gap-4"
      actions={
        <>
          {isOwned && deck.status === 'active' ? (
            <ButtonLink href={`/decks/${deck.id}/edit`} variant="secondary">
              Manage deck
            </ButtonLink>
          ) : null}

          {isOwned && (deck.status === 'archived' || deck.status === 'deleted') ? (
            <RestoreDeckButton deckId={deck.id} />
          ) : null}

          <Suspense fallback={<SkeletonBlock className="size-10 shrink-0 rounded-lg" />}>
            <DeckHeaderSafetyControls deckId={deck.id} />
          </Suspense>
        </>
      }
    >
      <DeckIdentity
        badges={identityBadges}
        languagePair={formatLanguagePair(deck.frontLanguage, deck.backLanguage)}
      />

      <Suspense fallback={null}>
        <DeckHeaderStatusDetails deckId={deck.id} />
      </Suspense>
    </PageHeader>
  );
}
