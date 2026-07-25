'use client';

import { Input, Label, ListBox, Select } from '@heroui/react';
import type { DeckDiscoverySort } from '@/lib/deck-discovery';

const standardSortOptions: Array<{ id: DeckDiscoverySort; label: string }> = [
  { id: 'popular', label: 'Most popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'Name' },
];

const recommendedSortOptions: Array<{ id: DeckDiscoverySort; label: string }> = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'Name' },
];

type Props = {
  idPrefix?: string;
  query: string;
  sort: DeckDiscoverySort;
  visibleCount: number;
  totalCount: number;
  compact?: boolean;
  includeRecommended?: boolean;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: DeckDiscoverySort) => void;
};

export default function DeckDiscoveryControls({
  idPrefix = 'deck-discovery',
  query,
  sort,
  visibleCount,
  totalCount,
  compact = false,
  includeRecommended = false,
  onQueryChange,
  onSortChange,
}: Props) {
  const searchId = `${idPrefix}-search`;
  const sortOptions = includeRecommended ? recommendedSortOptions : standardSortOptions;

  return (
    <div className={compact ? '' : 'space-y-2'}>
      <div
        className={
          compact
            ? 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-default-200 pb-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]'
            : 'grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]'
        }
      >
        <div className={compact ? 'col-span-2 sm:col-span-1' : 'form-field'}>
          <Label htmlFor={searchId} className={compact ? 'sr-only' : undefined}>
            Search decks
          </Label>
          <Input
            id={searchId}
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            placeholder="Search deck names or descriptions"
            variant="secondary"
            fullWidth
          />
        </div>

        <Select
          aria-label="Order by"
          value={sort}
          variant="secondary"
          fullWidth
          onChange={value => {
            if (value === null || Array.isArray(value)) return;
            onSortChange(String(value) as DeckDiscoverySort);
          }}
        >
          <Label className={compact ? 'sr-only' : undefined}>Order by</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {sortOptions.map(option => (
                <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <p
          className={
            compact
              ? 'text-sm whitespace-nowrap text-default-500 sm:text-right'
              : 'text-sm text-default-500'
          }
          aria-live="polite"
        >
          {compact ? (
            <>
              {visibleCount} of {totalCount}
              <span className="sr-only"> {totalCount === 1 ? 'deck' : 'decks'}</span>
            </>
          ) : (
            <>
              Showing {visibleCount} of {totalCount} {totalCount === 1 ? 'deck' : 'decks'}.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
