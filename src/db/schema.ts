import { integer, pgEnum, pgTable, serial, timestamp, unique, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const visibilityEnum = pgEnum('visibility', ['private', 'public']);

export const decks = pgTable('decks', {
  id: serial('id').primaryKey(),
  ownerId: varchar('owner_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
  visibility: visibilityEnum(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deckSubscriptions = pgTable(
  'deck_subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    deckId: integer('deck_id')
      .notNull()
      .references(() => decks.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => [unique('deck_subscriptions_user_id_deck_id_unique').on(table.userId, table.deckId)],
);

export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  deckId: integer('deck_id')
    .notNull()
    .references(() => decks.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vocabs = pgTable('vocabs', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  front: varchar('front', { length: 255 }).notNull(),
  back: varchar('back', { length: 255 }).notNull(),
  frontAlternatives: varchar('front_alternatives', { length: 255 })
    .array()
    .default(sql`ARRAY[]::varchar[]`)
    .notNull(),
  backAlternatives: varchar('back_alternatives', { length: 255 })
    .array()
    .default(sql`ARRAY[]::varchar[]`)
    .notNull(),
  reading: varchar('reading', { length: 255 }),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userVocabState = pgTable(
  'user_vocab_state',
  {
    id: serial('id').primaryKey(),

    userId: varchar('user_id', { length: 255 }).notNull(),
    vocabId: integer('vocab_id')
      .notNull()
      .references(() => vocabs.id, { onDelete: 'cascade' }),

    srsLevel: integer('srs_level').default(0).notNull(),
    dueAt: timestamp('due_at').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => [unique('user_vocab_state_user_id_vocab_id_unique').on(table.userId, table.vocabId)],
);
