import ButtonLink from '@/components/shared/button-link';
import type { PublicDeckSummary } from '@/db/queries/public-deck.queries';
import { formatLanguagePair } from '@/lib/languages';
import { Card } from '@heroui/react';
import Link from 'next/link';
import DeckIdentity from '@/components/shared/deck-identity';

type Props = {
  deck: PublicDeckSummary;
  showFollowerCount?: boolean;
};

export default function PublicDeckCard({ deck, showFollowerCount = true }: Props) {
  const href = `/public/decks/${deck.id}`;
  const languagePair = formatLanguagePair(deck.frontLanguage, deck.backLanguage);

  return (
    <Card className="flex h-full flex-col">
      <Card.Header className="pb-2">
        <div className="min-w-0 space-y-1">
          <h3 className="break-words text-lg font-semibold">
            <Link href={href} className="hover:text-primary hover:underline">
              {deck.title}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm text-default-500">
            {deck.description || 'A public flashcard deck you can preview before signing up.'}
          </p>
          <DeckIdentity badges={['public']} languagePair={languagePair} className="pt-1.5" />
        </div>
      </Card.Header>

      <Card.Content className="flex-1 space-y-3">
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-default-500">
          <div>
            <dt className="sr-only">Lessons</dt>
            <dd>
              {deck.lessonCount} {deck.lessonCount === 1 ? 'lesson' : 'lessons'}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Cards</dt>
            <dd>
              {deck.wordCount} {deck.wordCount === 1 ? 'card' : 'cards'}
            </dd>
          </div>
          {showFollowerCount && deck.subscriberCount > 0 ? (
            <div>
              <dt className="sr-only">Followers</dt>
              <dd>
                {deck.subscriberCount} {deck.subscriberCount === 1 ? 'follower' : 'followers'}
              </dd>
            </div>
          ) : null}
        </dl>
      </Card.Content>

      <Card.Footer>
        <ButtonLink href={href} variant="secondary" className="w-full">
          Preview cards <span className="sr-only">in {deck.title}</span>
        </ButtonLink>
      </Card.Footer>
    </Card>
  );
}
