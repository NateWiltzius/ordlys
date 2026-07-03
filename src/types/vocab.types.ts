import { vocabs } from '@/db/schema';

export type CreateVocab = typeof vocabs.$inferInsert;

export type Vocab = typeof vocabs.$inferSelect;
