import ButtonLink from '@/components/shared/button-link';
import PageHeader from '@/components/shared/layout/page-header';
import type { getDeckFollowState, inspectReleaseChanges } from '@/db/queries/deck-release.queries';
import type { DeckRelease } from '@/types/deck-release.types';
import type { Deck } from '@/types/deck.types';
import DeckBadge, { type DeckBadgeKind } from '@/components/shared/deck-badge';
import DeckSafetyControls from './deck-safety-controls';
import FollowReleaseControls from './follow-release-controls';
import RestoreDeckButton from './restore-deck-button';

type Props = {
  deck: Deck;
  isOwned: boolean;
  isFollowing: boolean;
  followState: Awaited<ReturnType<typeof getDeckFollowState>>;
  releases: DeckRelease[];
  releaseChanges: Awaited<ReturnType<typeof inspectReleaseChanges>> | null;
  canModerate: boolean;
};

export default function DeckHeader({
  deck,
  isOwned,
  isFollowing,
  followState,
  releases,
  releaseChanges,
  canModerate,
}: Props) {
  const badges: DeckBadgeKind[] = [];

  if (isOwned) badges.push(deck.sourceReleaseId ? 'copy' : 'owned');
  if (isFollowing) badges.push('following');

  if (deck.status === 'active') {
    badges.push(deck.visibility);
  } else if (isOwned) {
    badges.push(deck.visibility, deck.status === 'deleted' ? 'deletion-pending' : 'archived');
  } else {
    badges.push(deck.status === 'deleted' ? 'source-deletion-pending' : 'source-archived');
  }

  return (
    <PageHeader
      title={deck.title}
      description={deck.description || 'No description provided.'}
      contentClassName="flex-col items-stretch gap-4"
      actions={
        <>
          {isOwned && deck.status === 'active' ? (
            <ButtonLink href={`/decks/${deck.id}/edit`} variant="secondary">
              Edit deck
            </ButtonLink>
          ) : null}

          {isOwned && (deck.status === 'archived' || deck.status === 'deleted') ? (
            <RestoreDeckButton deckId={deck.id} />
          ) : null}

          <DeckSafetyControls
            deckId={deck.id}
            deckTitle={deck.title}
            status={deck.status}
            retentionUntil={deck.retentionUntil}
            isOwned={isOwned}
            isFollowing={isFollowing}
            canModerate={canModerate}
          />
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {badges.map(kind => (
          <DeckBadge key={kind} kind={kind} />
        ))}
      </div>

      {isOwned && deck.status === 'deleted' && deck.retentionUntil ? (
        <p className="text-sm text-default-500">
          Recoverable until {deck.retentionUntil.toLocaleDateString()}.
        </p>
      ) : null}

      {isFollowing && !isOwned && followState ? (
        <FollowReleaseControls
          deckId={deck.id}
          deckTitle={deck.title}
          followState={followState}
          releases={releases}
          releaseChanges={releaseChanges}
        />
      ) : null}
    </PageHeader>
  );
}
