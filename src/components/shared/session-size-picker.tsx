'use client';

import { getEstimatedStudyDuration, getSessionSizeChoices } from '@/lib/study-session-size';
import { buttonVariants } from '@heroui/react';
import Link from 'next/link';

type Props = {
  baseHref: string;
  selectedSize: number | 'all';
  sizes: readonly number[];
  totalCount: number;
  noun: string;
  allowAll?: boolean;
  preferenceCookieName?: string;
};

export default function SessionSizePicker({
  baseHref,
  selectedSize,
  sizes,
  totalCount,
  noun,
  allowAll = false,
  preferenceCookieName,
}: Props) {
  const selectedCount = selectedSize === 'all' ? totalCount : Math.min(selectedSize, totalCount);
  const sizeChoices = getSessionSizeChoices(sizes, totalCount);
  const isAllSelected = selectedSize === 'all' || selectedCount === totalCount;
  const showAllChoice = allowAll && sizeChoices.length > 0;

  if (totalCount <= 0) return null;

  const rememberSize = (size: number | 'all') => {
    if (!preferenceCookieName) return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${preferenceCookieName}=${size}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-default-200 bg-default-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">Session size</p>
        <p className="text-sm text-default-500">
          {selectedCount} of {totalCount} {totalCount === 1 ? noun : `${noun}s`} ·{' '}
          {getEstimatedStudyDuration(selectedCount)}
        </p>
      </div>
      {sizeChoices.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Choose session size">
          {sizeChoices.map(size => (
            <Link
              key={size}
              href={`${baseHref}?size=${size}`}
              onClick={() => rememberSize(size)}
              className={buttonVariants({
                size: 'sm',
                variant: selectedSize === size ? 'primary' : 'tertiary',
              })}
            >
              {size}
            </Link>
          ))}
          {showAllChoice ? (
            <Link
              href={`${baseHref}?size=all`}
              onClick={() => rememberSize('all')}
              className={buttonVariants({
                size: 'sm',
                variant: isAllSelected ? 'primary' : 'tertiary',
              })}
            >
              All ({totalCount})
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
