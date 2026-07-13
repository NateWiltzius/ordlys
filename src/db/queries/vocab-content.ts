import { vocabRevisions } from '@/db/schema';
import type { NormalizedVocabContent } from '@/lib/vocab/normalize-vocab-content';

export const vocabRevisionQuizSelection = {
  front: vocabRevisions.front,
  back: vocabRevisions.back,
  frontAlternatives: vocabRevisions.frontAlternatives,
  backAlternatives: vocabRevisions.backAlternatives,
  frontToBackQuizHint: vocabRevisions.frontToBackQuizHint,
  backToFrontQuizHint: vocabRevisions.backToFrontQuizHint,
  reading: vocabRevisions.reading,
};

export const vocabRevisionExtendedSelection = {
  tags: vocabRevisions.tags,
  metadata: vocabRevisions.metadata,
  notes: vocabRevisions.notes,
};

export const vocabRevisionContentSelection = {
  ...vocabRevisionQuizSelection,
  ...vocabRevisionExtendedSelection,
};

export function vocabRevisionValues(
  vocabId: number,
  content: NormalizedVocabContent,
  creatorId: string,
) {
  return { vocabId, ...vocabContentValues(content), creatorId };
}

export function vocabContentValues(content: NormalizedVocabContent): NormalizedVocabContent {
  return {
    front: content.front,
    back: content.back,
    frontAlternatives: content.frontAlternatives,
    backAlternatives: content.backAlternatives,
    frontToBackQuizHint: content.frontToBackQuizHint,
    backToFrontQuizHint: content.backToFrontQuizHint,
    reading: content.reading,
    tags: content.tags,
    metadata: content.metadata,
    notes: content.notes,
  };
}
