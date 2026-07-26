import type { DeckRelease } from '@/types/deck-release.types';
import type { Deck } from '@/types/deck.types';
import type { EditLessonSummary } from '@/types/lesson.types';

export function getDeckEditorStateKey({
  deck,
  lessons,
  releases,
  hasUnpublishedChanges,
}: {
  deck: Pick<Deck, 'updatedAt'>;
  lessons: Pick<
    EditLessonSummary,
    'id' | 'currentRevisionId' | 'orderIndex' | 'updatedAt' | 'vocabCount'
  >[];
  releases: Pick<DeckRelease, 'id' | 'version'>[];
  hasUnpublishedChanges: boolean;
}): string {
  return [
    deck.updatedAt.toISOString(),
    hasUnpublishedChanges,
    ...lessons.map(
      lesson =>
        `${lesson.id}:${lesson.currentRevisionId}:${lesson.orderIndex}:${lesson.vocabCount}:${lesson.updatedAt.toISOString()}`,
    ),
    ...releases.map(release => `${release.id}:${release.version}`),
  ].join('|');
}
