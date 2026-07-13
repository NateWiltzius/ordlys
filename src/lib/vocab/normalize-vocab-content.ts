import type { VocabMetadata } from '../../db/schema';
import { UserFacingError } from '../action-result';
import { CONTENT_LIMITS, optionalText, requiredText } from '../validation/content';
import { isJsonValue } from '../validation/json';

export type VocabContentInput = {
  front: string;
  back: string;
  frontAlternatives?: string[];
  backAlternatives?: string[];
  frontToBackQuizHint?: string | null;
  backToFrontQuizHint?: string | null;
  reading?: string | null;
  tags?: string[];
  metadata?: VocabMetadata | null;
  notes?: string | null;
};

export type NormalizedVocabContent = {
  front: string;
  back: string;
  frontAlternatives: string[];
  backAlternatives: string[];
  frontToBackQuizHint: string | null;
  backToFrontQuizHint: string | null;
  reading: string | null;
  tags: string[];
  metadata: VocabMetadata;
  notes: string | null;
};

export type NormalizedVocabUpdate = Omit<NormalizedVocabContent, 'tags' | 'metadata' | 'notes'> & {
  tags?: string[];
  metadata?: VocabMetadata;
  notes?: string | null;
};

export function normalizeVocabContent(input: VocabContentInput): NormalizedVocabContent {
  const content = normalizeCoreContent(input);

  return {
    ...content,
    tags: normalizeTags(input.tags),
    metadata: normalizeMetadata(input.metadata),
    notes: optionalText(input.notes, 'Notes', CONTENT_LIMITS.vocabNotes),
  };
}

export function normalizeVocabUpdate(input: VocabContentInput): NormalizedVocabUpdate {
  const content = normalizeCoreContent(input);

  return {
    ...content,
    ...(input.tags === undefined ? {} : { tags: normalizeTags(input.tags) }),
    ...(input.metadata === undefined ? {} : { metadata: normalizeMetadata(input.metadata) }),
    ...(input.notes === undefined
      ? {}
      : { notes: optionalText(input.notes, 'Notes', CONTENT_LIMITS.vocabNotes) }),
  };
}

function normalizeCoreContent(input: VocabContentInput) {
  const front = requiredText(input.front, 'Front text', CONTENT_LIMITS.vocabText);
  const back = requiredText(input.back, 'Back text', CONTENT_LIMITS.vocabText);

  return {
    front,
    back,
    frontAlternatives: normalizeAlternatives(input.frontAlternatives, front),
    backAlternatives: normalizeAlternatives(input.backAlternatives, back),
    frontToBackQuizHint: optionalText(
      input.frontToBackQuizHint,
      'Front to back quiz hint',
      CONTENT_LIMITS.vocabText,
    ),
    backToFrontQuizHint: optionalText(
      input.backToFrontQuizHint,
      'Back to front quiz hint',
      CONTENT_LIMITS.vocabText,
    ),
    reading: optionalText(input.reading, 'Reading', CONTENT_LIMITS.vocabText),
  };
}

export function resolveVocabUpdate(
  update: NormalizedVocabUpdate,
  current: Pick<NormalizedVocabContent, 'tags' | 'metadata' | 'notes'>,
): NormalizedVocabContent {
  return {
    ...update,
    tags: update.tags ?? current.tags,
    metadata: update.metadata ?? current.metadata,
    notes: update.notes === undefined ? current.notes : update.notes,
  };
}

export function normalizeAlternatives(
  alternatives: string[] | undefined,
  canonicalAnswer: string,
): string[] {
  if (alternatives === undefined) return [];

  if (!Array.isArray(alternatives) || alternatives.length > CONTENT_LIMITS.alternatives) {
    throw new UserFacingError(
      'VALIDATION_ERROR',
      `Alternatives must contain at most ${CONTENT_LIMITS.alternatives} answers.`,
    );
  }

  const canonicalNormalized = normalizedKey(canonicalAnswer);
  const uniqueAlternatives = new Map<string, string>();

  for (const alternative of alternatives) {
    if (typeof alternative !== 'string') {
      throw new UserFacingError('VALIDATION_ERROR', 'Each alternative must be text.');
    }

    const trimmedAlternative = alternative.trim();
    if (!trimmedAlternative) continue;
    if (trimmedAlternative.length > CONTENT_LIMITS.vocabText) {
      throw new UserFacingError(
        'VALIDATION_ERROR',
        `Each alternative must be ${CONTENT_LIMITS.vocabText} characters or fewer.`,
      );
    }

    const key = normalizedKey(trimmedAlternative);
    if (key !== canonicalNormalized) uniqueAlternatives.set(key, trimmedAlternative);
  }

  return [...uniqueAlternatives.values()];
}

export function normalizeTags(tags: string[] | undefined): string[] {
  if (tags === undefined) return [];
  if (!Array.isArray(tags)) {
    throw new UserFacingError('VALIDATION_ERROR', 'Tags must be a list of text values.');
  }

  const uniqueTags = new Map<string, string>();
  for (const tag of tags) {
    if (typeof tag !== 'string') {
      throw new UserFacingError('VALIDATION_ERROR', 'Each tag must be text.');
    }

    const normalizedTag = tag.trim();
    if (!normalizedTag) continue;
    if (normalizedTag.length > CONTENT_LIMITS.vocabTag) {
      throw new UserFacingError(
        'VALIDATION_ERROR',
        `Each tag must be ${CONTENT_LIMITS.vocabTag} characters or fewer.`,
      );
    }

    uniqueTags.set(normalizedKey(normalizedTag), normalizedTag);
  }

  return [...uniqueTags.values()];
}

export function normalizeMetadata(metadata: VocabMetadata | null | undefined): VocabMetadata {
  if (metadata === undefined || metadata === null) return {};
  if (!isPlainObject(metadata)) {
    throw new UserFacingError('VALIDATION_ERROR', 'Metadata must be an object.');
  }

  for (const value of Object.values(metadata)) {
    if (!isJsonValue(value)) {
      throw new UserFacingError('VALIDATION_ERROR', 'Metadata must contain only JSON values.');
    }
  }

  return metadata;
}

function normalizedKey(value: string) {
  return value.normalize('NFKC').toLowerCase();
}

function isPlainObject(value: unknown): value is VocabMetadata {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
