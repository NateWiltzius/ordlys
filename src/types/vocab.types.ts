import { vocabs } from '@/db/schema';

export type CreateVocab = typeof vocabs.$inferInsert;

export type BulkCreateVocabInput = Pick<CreateVocab, 'front' | 'back' | 'reading'>;

export type Vocab = typeof vocabs.$inferSelect;

export type UpdateVocabInput = Pick<
  CreateVocab,
  | 'front'
  | 'back'
  | 'frontAlternatives'
  | 'backAlternatives'
  | 'frontToBackQuizHint'
  | 'backToFrontQuizHint'
  | 'reading'
  | 'tags'
  | 'metadata'
  | 'notes'
>;
