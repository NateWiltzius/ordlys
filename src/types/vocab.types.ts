import { vocabs } from '@/db/schema';

export type CreateVocab = typeof vocabs.$inferInsert;

export type Vocab = typeof vocabs.$inferSelect;

export type UpdateVocabInput = Pick<
  CreateVocab,
  'front' | 'back' | 'frontAlternatives' | 'backAlternatives' | 'reading'
>;
