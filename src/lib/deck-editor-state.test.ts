import { describe, expect, it } from 'vitest';
import { getDeckEditorStateKey } from './deck-editor-state';

const baseInput = {
  deck: { updatedAt: new Date('2026-07-01T10:00:00.000Z') },
  lessons: [
    {
      id: 1,
      currentRevisionId: 2,
      orderIndex: 0,
      updatedAt: new Date('2026-07-02T10:00:00.000Z'),
      vocabCount: 3,
    },
  ],
  releases: [{ id: 4, version: 1 }],
  hasUnpublishedChanges: false,
};

describe('getDeckEditorStateKey', () => {
  it('is stable for equivalent server data', () => {
    expect(getDeckEditorStateKey(baseInput)).toBe(getDeckEditorStateKey({ ...baseInput }));
  });

  it.each([
    ['lesson count', { lessons: [{ ...baseInput.lessons[0], vocabCount: 4 }] }],
    ['lesson order', { lessons: [{ ...baseInput.lessons[0], orderIndex: 1 }] }],
    ['publication state', { hasUnpublishedChanges: true }],
    ['release version', { releases: [{ id: 4, version: 2 }] }],
  ])('changes when %s changes', (_label, change) => {
    expect(getDeckEditorStateKey({ ...baseInput, ...change })).not.toBe(
      getDeckEditorStateKey(baseInput),
    );
  });
});
