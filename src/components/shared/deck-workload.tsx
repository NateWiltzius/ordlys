import { Chip } from '@heroui/react';

type Props = {
  reviewsDue: number;
  newWordsAvailable: number;
  className?: string;
};

export default function DeckWorkload({ reviewsDue, newWordsAvailable, className = '' }: Props) {
  if (reviewsDue <= 0 && newWordsAvailable <= 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
      aria-label={`${reviewsDue} reviews due, ${newWordsAvailable} new words available`}
    >
      {reviewsDue > 0 ? (
        <Chip size="sm" variant="soft" color="success">
          {reviewsDue} due
        </Chip>
      ) : null}
      {newWordsAvailable > 0 ? (
        <Chip size="sm" variant="soft" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
          {newWordsAvailable} new
        </Chip>
      ) : null}
    </div>
  );
}
