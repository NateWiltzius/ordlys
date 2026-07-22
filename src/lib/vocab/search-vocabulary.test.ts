import { describe, expect, it } from 'vitest';
import type { Vocab } from '@/types/vocab.types';
import { filterVocabulary, matchesVocabularySearch } from './search-vocabulary';

const vocab = {
  id: 1,
  lessonId: 10,
  front: 'å snakke',
  back: 'to speak',
  reading: 'snakker',
  notes: 'Common conversation verb',
  frontAlternatives: ['prate'],
  backAlternatives: ['to talk'],
  tags: ['verbs'],
} as Vocab;

describe('matchesVocabularySearch', () => {
  it.each(['SNAKKE', 'speak', 'snakker', 'prate', 'talk', 'verbs', 'conversation'])(
    'matches searchable vocabulary content for %s',
    query => {
      expect(matchesVocabularySearch(vocab, query)).toBe(true);
    },
  );

  it('requires every search term to match', () => {
    expect(matchesVocabularySearch(vocab, 'common verb')).toBe(true);
    expect(matchesVocabularySearch(vocab, 'common noun')).toBe(false);
  });

  it('treats an empty query as a match', () => {
    expect(matchesVocabularySearch(vocab, '   ')).toBe(true);
  });
});

describe('filterVocabulary', () => {
  it('keeps the original vocabulary order', () => {
    const second = { ...vocab, id: 2, front: 'hus', back: 'house' };
    const third = { ...vocab, id: 3, front: 'tale', back: 'to speak formally' };
    expect(filterVocabulary([vocab, second, third], 'speak')).toEqual([vocab, third]);
  });
});
