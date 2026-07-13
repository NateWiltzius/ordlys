import { describe, expect, it } from 'vitest';
import {
  normalizeVocabContent,
  normalizeVocabUpdate,
  resolveVocabUpdate,
} from './normalize-vocab-content';

describe('vocabulary content normalization', () => {
  it('normalizes a complete vocabulary payload consistently', () => {
    expect(
      normalizeVocabContent({
        front: '  Hus  ',
        back: ' House ',
        frontAlternatives: ['hus', ' Huset ', 'HUSET', ''],
        backAlternatives: [' Home '],
        frontToBackQuizHint: '  noun  ',
        reading: '  hÅ«s  ',
        tags: [' Noun ', 'noun', 'Core'],
        metadata: { frequency: 12, flags: ['common'] },
        notes: '  A useful note.  ',
      }),
    ).toEqual({
      front: 'Hus',
      back: 'House',
      frontAlternatives: ['HUSET'],
      backAlternatives: ['Home'],
      frontToBackQuizHint: 'noun',
      backToFrontQuizHint: null,
      reading: 'hÅ«s',
      tags: ['noun', 'Core'],
      metadata: { frequency: 12, flags: ['common'] },
      notes: 'A useful note.',
    });
  });

  it('supplies complete defaults for create and replacement payloads', () => {
    expect(normalizeVocabContent({ front: 'ord', back: 'word' })).toEqual({
      front: 'ord',
      back: 'word',
      frontAlternatives: [],
      backAlternatives: [],
      frontToBackQuizHint: null,
      backToFrontQuizHint: null,
      reading: null,
      tags: [],
      metadata: {},
      notes: null,
    });
  });

  it('preserves omitted extended fields during an update', () => {
    const update = normalizeVocabUpdate({ front: 'ny', back: 'new' });
    expect(update).not.toHaveProperty('tags');
    expect(update).not.toHaveProperty('metadata');
    expect(update).not.toHaveProperty('notes');

    expect(
      resolveVocabUpdate(update, {
        tags: ['existing'],
        metadata: { source: 'import' },
        notes: 'Keep me',
      }),
    ).toMatchObject({
      tags: ['existing'],
      metadata: { source: 'import' },
      notes: 'Keep me',
    });
  });

  it('allows an update to explicitly clear extended fields', () => {
    const update = normalizeVocabUpdate({
      front: 'ny',
      back: 'new',
      tags: [],
      metadata: null,
      notes: null,
    });

    expect(
      resolveVocabUpdate(update, {
        tags: ['existing'],
        metadata: { source: 'import' },
        notes: 'Keep me',
      }),
    ).toMatchObject({ tags: [], metadata: {}, notes: null });
  });

  it('rejects invalid alternative and metadata values', () => {
    expect(() =>
      normalizeVocabContent({
        front: 'ord',
        back: 'word',
        frontAlternatives: [42] as unknown as string[],
      }),
    ).toThrow('Each alternative must be text.');

    expect(() =>
      normalizeVocabContent({
        front: 'ord',
        back: 'word',
        metadata: { invalid: undefined } as never,
      }),
    ).toThrow('Metadata must contain only JSON values.');
  });
});
