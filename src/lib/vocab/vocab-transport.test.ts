import { describe, expect, it } from 'vitest';
import { deserializeVocab, serializeVocab } from './vocab-transport';
import type { Vocab } from '../../types/vocab.types';

const vocab: Vocab = {
  id: 7,
  sourceVocabId: null,
  rootVocabId: null,
  currentRevisionId: 11,
  removedAt: new Date('2026-07-25T10:00:00.000Z'),
  lessonId: 3,
  front: 'hej',
  back: 'hello',
  frontAlternatives: [],
  backAlternatives: ['hi'],
  frontToBackQuizHint: null,
  backToFrontQuizHint: null,
  reading: null,
  tags: ['greeting'],
  metadata: {},
  notes: null,
  orderIndex: 2,
  createdAt: new Date('2026-07-20T08:00:00.000Z'),
  updatedAt: new Date('2026-07-24T09:30:00.000Z'),
};

describe('vocabulary transport', () => {
  it('serializes date fields for JSON and restores the domain type', () => {
    const serialized = serializeVocab(vocab);

    expect(serialized.createdAt).toBe('2026-07-20T08:00:00.000Z');
    expect(serialized.removedAt).toBe('2026-07-25T10:00:00.000Z');
    expect(serialized.updatedAt).toBe('2026-07-24T09:30:00.000Z');
    expect(deserializeVocab(serialized)).toEqual(vocab);
  });
});
