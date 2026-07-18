'use client';

import { Input, Label, ListBox, Select } from '@heroui/react';
import type { DeckDiscoverySort } from '@/lib/deck-discovery';

const sortOptions: Array<{ id: DeckDiscoverySort; label: string }> = [
  { id: 'popular', label: 'Most popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'Name' },
];

type Props = {
  idPrefix?: string;
  query: string;
  sort: DeckDiscoverySort;
  visibleCount: number;
  totalCount: number;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: DeckDiscoverySort) => void;
};

export default function DeckDiscoveryControls({
  idPrefix = 'deck-discovery',
  query,
  sort,
  visibleCount,
  totalCount,
  onQueryChange,
  onSortChange,
}: Props) {
  const searchId = `${idPrefix}-search`;

  return (
    <div className="space-y-2">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="form-field">
          <Label htmlFor={searchId}>Search decks</Label>
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
          <Label>Order by</Label>
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
      </div>

      <p className="text-sm text-default-500" aria-live="polite">
        Showing {visibleCount} of {totalCount} {totalCount === 1 ? 'deck' : 'decks'}.
      </p>
    </div>
  );
}
