import { getVocabGridColumns } from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-grid';
import { SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';

export default function VocabularyLoading() {
  const desktopColumns = getVocabGridColumns(false, true);

  return (
    <div className="overflow-hidden rounded-lg border border-default-200" aria-hidden="true">
      <div
        className={`hidden gap-4 border-b border-default-200 bg-default-100 px-4 py-2 sm:grid sm:items-center ${desktopColumns}`}
      >
        <SkeletonLine className="h-3 w-4" />
        <SkeletonLine className="h-3 w-12" />
        <SkeletonLine className="h-3 w-12" />
        <SkeletonLine className="h-3 w-16 sm:ml-auto" />
      </div>
      <div className="divide-y divide-default-200">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className={`grid gap-4 bg-background px-4 py-4 sm:items-center sm:py-3 ${desktopColumns}`}
          >
            <SkeletonLine className="hidden h-4 w-4 sm:block" />
            <SkeletonLine className="h-4 w-2/3" />
            <SkeletonLine className="h-4 w-3/4" />
            <SkeletonBlock className="h-8 w-32 rounded-lg sm:ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
