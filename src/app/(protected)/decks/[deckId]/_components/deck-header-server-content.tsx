import DeckSafetyControls from '@/app/(protected)/decks/[deckId]/_components/deck-safety-controls';
import FollowReleaseControls from '@/app/(protected)/decks/[deckId]/_components/follow-release-controls';
import { getCachedDeckHeaderControlsData } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-deck-page-data';
import { canFinalizeDeckDeletion } from '@/lib/deck-deletion-policy';

export async function DeckHeaderSafetyControls({ deckId }: { deckId: number }) {
  const data = await getCachedDeckHeaderControlsData(deckId);
  if (!data) return null;

  const { deck, isOwned, isFollowing, canModerate } = data;

  return (
    <DeckSafetyControls
      deckId={deck.id}
      deckTitle={deck.title}
      status={deck.status}
      isOwned={isOwned}
      isFollowing={isFollowing}
      canFollow={!isFollowing && deck.status === 'active' && deck.currentReleaseId !== null}
      canModerate={canModerate}
    />
  );
}

export async function DeckHeaderStatusDetails({ deckId }: { deckId: number }) {
  const data = await getCachedDeckHeaderControlsData(deckId);
  if (!data) return null;

  const {
    deck,
    isOwned,
    isFollowing,
    followState,
    releases,
    releaseChanges,
    protectedFollowerCount,
  } = data;

  return (
    <>
      {isOwned && deck.status === 'deleted' && deck.retentionUntil ? (
        <p className="text-sm text-default-500">
          {protectedFollowerCount !== null &&
          canFinalizeDeckDeletion(protectedFollowerCount, deck.retentionUntil)
            ? 'Ready for permanent deletion.'
            : `Permanent deletion available from ${deck.retentionUntil.toLocaleDateString()}. You can restore this deck until you permanently delete it.`}
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
    </>
  );
}
