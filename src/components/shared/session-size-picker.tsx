import ButtonLink from '@/components/shared/button-link';
import { getSessionSizeChoices } from '@/lib/study-session-size';

type Props = {
  baseHref: string;
  selectedSize: number | 'all';
  sizes: readonly number[];
  totalCount: number;
  noun: string;
  allowAll?: boolean;
};

export default function SessionSizePicker({
  baseHref,
  selectedSize,
  sizes,
  totalCount,
  noun,
  allowAll = false,
}: Props) {
  const selectedCount = selectedSize === 'all' ? totalCount : Math.min(selectedSize, totalCount);
  const sizeChoices = getSessionSizeChoices(sizes, totalCount);
  const isAllSelected = selectedSize === 'all' || selectedCount === totalCount;

  if (sizeChoices.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-default-200 bg-default-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">Session size</p>
        <p className="text-sm text-default-500">
          {selectedCount} of {totalCount} {totalCount === 1 ? noun : `${noun}s`} in this session
        </p>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Choose session size">
        {sizeChoices.map(size => (
          <ButtonLink
            key={size}
            href={`${baseHref}?size=${size}`}
            size="sm"
            variant={selectedSize === size ? 'primary' : 'tertiary'}
          >
            {size}
          </ButtonLink>
        ))}
        {allowAll ? (
          <ButtonLink
            href={`${baseHref}?size=all`}
            size="sm"
            variant={isAllSelected ? 'primary' : 'tertiary'}
          >
            All
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
