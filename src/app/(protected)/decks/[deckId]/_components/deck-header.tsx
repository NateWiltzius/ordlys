import UnfollowDeckButton from '@/app/(protected)/decks/[deckId]/_components/unfollow-deck-button';
import ButtonLink from '@/components/shared/button-link';
import PageHeader from '@/components/shared/layout/page-header';
import type { getDeckFollowState, inspectReleaseChanges } from '@/db/queries/deck-release.queries';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { DeckRelease } from '@/types/deck-release.types';
import type { Deck } from '@/types/deck.types';
import { Chip } from '@heroui/react';
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

          {isFollowing ? <UnfollowDeckButton deckId={deck.id} deckTitle={deck.title} /> : null}

          <DeckSafetyControls
            deckId={deck.id}
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
        {isOwned ? (
          <>
            <Chip color="warning" size="sm">
              {deck.sourceReleaseId ? 'Your independent fork' : 'You own this deck'}
            </Chip>

            {isFollowing ? (
              <Chip size="sm" className={STUDY_TONE_STYLES.learning.accent}>
                Following to learn
              </Chip>
            ) : null}

            <Chip
              size="sm"
              variant="soft"
              color={deck.visibility === 'public' ? 'success' : 'default'}
            >
              {deck.visibility === 'public'
                ? 'Public'
                : deck.visibility === 'unlisted'
                  ? 'Unlisted'
                  : 'Private'}
            </Chip>

            <Chip size="sm" variant="soft">
              {deck.status === 'deleted'
                ? `Deletion pending · recoverable until ${deck.retentionUntil?.toLocaleDateString() ?? 'unknown'}`
                : deck.status === 'archived'
                  ? 'Archived'
                  : deck.status}
            </Chip>
          </>
        ) : deck.status === 'archived' || deck.status === 'deleted' ? (
          <Chip color="warning" size="sm">
            Source {deck.status} · studying the last available release
          </Chip>
        ) : isFollowing ? (
          <Chip size="sm" className={STUDY_TONE_STYLES.learning.accent}>
            Following · updates from the author
          </Chip>
        ) : (
          <Chip size="sm">Public deck</Chip>
        )}
      </div>

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
