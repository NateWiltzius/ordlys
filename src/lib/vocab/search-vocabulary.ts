import type { Vocab } from '@/types/vocab.types';

function searchableText(vocab: Vocab): string {
  return [
    vocab.front,
    vocab.back,
    vocab.reading,
    vocab.notes,
    ...vocab.frontAlternatives,
    ...vocab.backAlternatives,
    ...vocab.tags,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLocaleLowerCase();
}

export function matchesVocabularySearch(vocab: Vocab, query: string): boolean {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

  if (terms.length === 0) return true;

  const haystack = searchableText(vocab);
  return terms.every(term => haystack.includes(term));
}

export function filterVocabulary(vocabs: Vocab[], query: string): Vocab[] {
  return vocabs.filter(vocab => matchesVocabularySearch(vocab, query));
}
