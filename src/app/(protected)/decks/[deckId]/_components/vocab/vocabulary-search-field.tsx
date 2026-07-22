'use client';

import { Button, Input, Label } from '@heroui/react';

type Props = {
  id: string;
  query: string;
  resultCount: number | null;
  isLoading: boolean;
  onQueryChange: (query: string) => void;
};

export default function VocabularySearchField({
  id,
  query,
  resultCount,
  isLoading,
  onQueryChange,
}: Props) {
  const hasQuery = query.trim().length > 0;

  return (
    <div className="rounded-lg border border-default-200 bg-default-50 p-3 sm:p-4">
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <Label htmlFor={id} className="font-medium text-foreground">
          Search vocabulary
        </Label>
        <p className="text-xs text-muted sm:text-sm" aria-live="polite">
          {!hasQuery
            ? 'Across every lesson in this deck'
            : isLoading
              ? 'Loading vocabulary…'
              : resultCount === null
                ? 'Vocabulary could not be searched'
                : `${resultCount} ${resultCount === 1 ? 'match' : 'matches'}`}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Input
          id={id}
          type="search"
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder="Search words, meanings, readings, or tags"
          variant="secondary"
          fullWidth
        />
        {hasQuery ? (
          <Button className="shrink-0" variant="tertiary" onPress={() => onQueryChange('')}>
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
