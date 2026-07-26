import type { DeckBadgeKind } from '@/components/shared/deck-badge';
import DeckCoverage from '@/components/shared/deck-coverage';
import DeckIdentity from '@/components/shared/deck-identity';
import DeckMetadataLine from '@/components/shared/deck-metadata-line';
import DeckWorkload from '@/components/shared/deck-workload';
import StatusAlert from '@/components/shared/status-alert';
import type { DeckCardRelationship } from '@/lib/deck-card-actions';
import type { ReviewCounts } from '@/types/review.types';
import type { Deck } from '@/types/deck.types';
import { Card } from '@heroui/react';
import Link from 'next/link';

type ViewProps = {
  deck: Deck;
  relationship: DeckCardRelationship;
  badges: DeckBadgeKind[];
  languagePair: string | null;
  stats: ReviewCounts;
  introducedCards: number;
  activityMetadata: string[];
  mutationError: string | null;
  retentionMessage: string;
  primaryAction: React.ReactNode;
  menuAction: React.ReactNode;
  confirmationDialog: React.ReactNode;
  subscriberCount?: number;
  lessonCount?: number;
  wordCount?: number;
};

export function DeckCardRowView(props: ViewProps) {
  const {
    deck,
    relationship,
    badges,
    languagePair,
    stats,
    introducedCards,
    activityMetadata,
    mutationError,
    retentionMessage,
    primaryAction,
    menuAction,
    confirmationDialog,
  } = props;

  return (
    <article className="py-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="min-w-0 text-lg font-semibold">
            <Link
              href={`/decks/${deck.id}`}
              className="break-words rounded-sm hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {deck.title}
            </Link>
          </h3>
          <DeckIdentity badges={badges} languagePair={languagePair} className="mt-1.5" />
          {activityMetadata.length > 0 ? (
            <DeckMetadataLine rows={[activityMetadata]} className="mt-1" />
          ) : null}
          {deck.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-default-500 sm:line-clamp-1">
              {deck.description}
            </p>
          ) : null}
          <DeckWorkload
            reviewsDue={stats.reviewsDue}
            newWordsAvailable={stats.newWordsAvailable}
            className="mt-2"
          />
          <DeckCoverage
            started={introducedCards}
            total={stats.totalWords}
            deckTitle={deck.title}
            className="mt-3 max-w-xl"
          />
          {mutationError ? (
            <StatusAlert status="danger" className="mt-3">
              {mutationError}
            </StatusAlert>
          ) : null}
          {relationship === 'restorable' && deck.status === 'deleted' ? (
            <p className="mt-2 text-xs text-default-500">{retentionMessage}</p>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          {primaryAction}
          {menuAction}
        </div>
      </div>
      {confirmationDialog}
    </article>
  );
}

export function DeckCardTileView(props: ViewProps) {
  const {
    deck,
    relationship,
    badges,
    languagePair,
    mutationError,
    retentionMessage,
    primaryAction,
    menuAction,
    confirmationDialog,
    lessonCount,
    wordCount,
    subscriberCount,
  } = props;
  const hasCounts =
    lessonCount !== undefined || wordCount !== undefined || subscriberCount !== undefined;

  return (
    <Card className="flex h-full w-full flex-col">
      <Card.Header className="pb-2">
        <div className="min-w-0 space-y-1">
          <h3 className="break-words text-lg font-semibold">
            <Link
              href={`/decks/${deck.id}`}
              className="rounded-sm hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {deck.title}
            </Link>
          </h3>
          <p
            className={
              deck.description
                ? 'line-clamp-2 text-sm text-default-500'
                : 'text-sm italic text-default-400'
            }
          >
            {deck.description || 'No description'}
          </p>
          <DeckIdentity badges={badges} languagePair={languagePair} className="pt-1.5" />
        </div>
      </Card.Header>
      <Card.Content className="flex-1 space-y-3">
        {hasCounts ? (
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-default-500">
            <Count label="Lessons" value={lessonCount} singular="lesson" plural="lessons" />
            <Count label="Cards" value={wordCount} singular="card" plural="cards" />
            <Count
              label="Followers"
              value={subscriberCount && subscriberCount > 0 ? subscriberCount : undefined}
              singular="follower"
              plural="followers"
            />
          </dl>
        ) : null}
      </Card.Content>
      <Card.Footer>
        <div className="flex w-full flex-col gap-2">
          {mutationError ? <StatusAlert status="danger">{mutationError}</StatusAlert> : null}
          {relationship === 'restorable' && deck.status === 'deleted' ? (
            <p className="text-xs text-default-500">{retentionMessage}</p>
          ) : null}
          <div className="flex items-start gap-2">
            {primaryAction}
            {menuAction}
          </div>
        </div>
      </Card.Footer>
      {confirmationDialog}
    </Card>
  );
}

function Count({
  label,
  value,
  singular,
  plural,
}: {
  label: string;
  value: number | undefined;
  singular: string;
  plural: string;
}) {
  if (value === undefined) return null;
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        {value} {value === 1 ? singular : plural}
      </dd>
    </div>
  );
}
