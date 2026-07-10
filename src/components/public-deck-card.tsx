import ButtonLink from '@/components/shared/button-link';
import type { PublicDeckSummary } from '@/db/queries/public-deck.queries';
import { LANGUAGE_OPTIONS } from '@/lib/languages';
import { Card, Chip } from '@heroui/react';
import Link from 'next/link';

type Props = {
  deck: PublicDeckSummary;
};

export default function PublicDeckCard({ deck }: Props) {
  const href = `/public/decks/${deck.id}`;
  const languagePair = formatLanguagePair(deck.frontLanguage, deck.backLanguage);

  return (
    <Card className="flex h-full flex-col border border-default-200 shadow-sm">
      <Card.Header className="flex-row items-start justify-between gap-3 pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="break-words text-lg font-semibold">
            <Link href={href} className="hover:text-primary hover:underline">
              {deck.title}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm text-default-500">
            {deck.description || 'A public vocabulary deck you can preview before signing up.'}
          </p>
        </div>
        <Chip size="sm" variant="soft" color="success" className="shrink-0">
          Public
        </Chip>
      </Card.Header>

      <Card.Content className="flex-1 space-y-3">
        {languagePair ? <p className="text-sm font-medium">{languagePair}</p> : null}
        <dl className="flex gap-5 text-sm text-default-500">
          <div>
            <dt className="sr-only">Lessons</dt>
            <dd>
              {deck.lessonCount} {deck.lessonCount === 1 ? 'lesson' : 'lessons'}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Words</dt>
            <dd>
              {deck.wordCount} {deck.wordCount === 1 ? 'word' : 'words'}
            </dd>
          </div>
        </dl>
      </Card.Content>

      <Card.Footer>
        <ButtonLink href={href} variant="secondary" className="w-full">
          Preview deck
        </ButtonLink>
      </Card.Footer>
    </Card>
  );
}

function formatLanguagePair(frontLanguage: string | null, backLanguage: string | null) {
  const front = languageName(frontLanguage);
  const back = languageName(backLanguage);

  if (front && back) return `${front} → ${back}`;
  return front ?? back;
}

function languageName(code: string | null) {
  if (!code) return null;
  return LANGUAGE_OPTIONS.find(language => language.code === code)?.name ?? code;
}
