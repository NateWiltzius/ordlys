import PageHeader from '@/components/shared/layout/page-header';
import type { getDeckFollowState, inspectReleaseChanges } from '@/db/queries/deck-release.queries';
import type { DeckRelease } from '@/types/deck-release.types';
import type { Deck } from '@/types/deck.types';
import DeckSafetyControls from './deck-safety-controls';
import FollowReleaseControls from './follow-release-controls';
import RestoreDeckButton from './restore-deck-button';
import { canFinalizeDeckDeletion } from '@/lib/deck-deletion-policy';
import ButtonLink from '@/components/shared/button-link';
import DeckMetadataLine from '@/components/shared/deck-metadata-line';
import { formatLanguagePair } from '@/lib/languages';

type Props = {
  deck: Deck;
  isOwned: boolean;
  isFollowing: boolean;
  followState: Awaited<ReturnType<typeof getDeckFollowState>>;
  releases: DeckRelease[];
  releaseChanges: Awaited<ReturnType<typeof inspectReleaseChanges>> | null;
  canModerate: boolean;
  protectedFollowerCount: number | null;
};

export default function DeckHeader({
  deck,
  isOwned,
  isFollowing,
  followState,
  releases,
  releaseChanges,
  canModerate,
  protectedFollowerCount,
}: Props) {
  const relationship = isOwned
    ? deck.sourceReleaseId
      ? 'Copy'
      : 'Owned'
    : isFollowing
      ? 'Following'
      : null;
  const visibility =
    deck.status === 'active'
      ? `${deck.visibility[0].toUpperCase()}${deck.visibility.slice(1)}`
      : isOwned
        ? deck.status === 'deleted'
          ? 'Deletion pending'
          : 'Archived'
        : deck.status === 'deleted'
          ? 'Source deletion pending'
          : 'Source archived';
  const metadata = [
    formatLanguagePair(deck.frontLanguage, deck.backLanguage),
    relationship,
    visibility,
  ].filter((item): item is string => Boolean(item));

  return (
    <PageHeader
      title={deck.title}
      description={deck.description || 'No description provided.'}
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

          <DeckSafetyControls
            deckId={deck.id}
            deckTitle={deck.title}
            status={deck.status}
            retentionUntil={deck.retentionUntil}
            isOwned={isOwned}
            isFollowing={isFollowing}
            canFollow={!isFollowing && deck.status === 'active' && deck.currentReleaseId !== null}
            canModerate={canModerate}
            protectedFollowerCount={protectedFollowerCount}
          />
        </>
      }
    >
      <DeckMetadataLine rows={[metadata]} />

      {isOwned && deck.status === 'deleted' && deck.retentionUntil ? (
        <p className="text-sm text-default-500">
          {protectedFollowerCount !== null &&
          canFinalizeDeckDeletion(protectedFollowerCount, deck.retentionUntil)
            ? 'Ready for permanent deletion.'
            : `Recoverable until ${deck.retentionUntil.toLocaleDateString()}.`}
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
