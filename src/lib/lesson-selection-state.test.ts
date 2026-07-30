import { describe, expect, it } from 'vitest';
import { parseSelectedLessonId } from './lesson-selection-state';

describe('parseSelectedLessonId', () => {
  it('selects the first lesson by default', () => {
    expect(parseSelectedLessonId(undefined, [10, 20, 30])).toBe(10);
  });

  it('restores an available lesson from the URL', () => {
    expect(parseSelectedLessonId('30', [10, 20, 30])).toBe(30);
  });

  it.each(['nope', '0', '-1', '999'])('falls back for invalid or unavailable value %s', value => {
    expect(parseSelectedLessonId(value, [10, 20, 30])).toBe(10);
  });

  it('rejects repeated lesson parameters', () => {
    expect(parseSelectedLessonId(['20', '30'], [10, 20, 30])).toBe(10);
  });

  it('handles decks without lessons', () => {
    expect(parseSelectedLessonId('10', [])).toBeNull();
  });
});
