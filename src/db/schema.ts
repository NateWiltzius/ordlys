import {
  AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type VocabMetadata = Record<string, JsonValue>;

export const visibilityEnum = pgEnum('visibility', ['private', 'public']);

export const decks = pgTable(
  'decks',
  {
    id: serial('id').primaryKey(),
    ownerId: uuid('owner_id').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }),
    frontLanguage: varchar('front_language', { length: 35 }),
    backLanguage: varchar('back_language', { length: 35 }),
    visibility: visibilityEnum(),
    sourceDeckId: integer('source_deck_id').references((): AnyPgColumn => decks.id, {
      onDelete: 'set null',
    }),
    isEditableCopy: boolean('is_editable_copy').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => [
    index('decks_owner_id_idx').on(table.ownerId),
    index('decks_source_deck_id_idx').on(table.sourceDeckId),
    index('decks_visibility_deleted_at_idx').on(table.visibility, table.deletedAt),
  ],
);

export const deckSubscriptions = pgTable(
  'deck_subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    deckId: integer('deck_id')
      .notNull()
      .references(() => decks.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => [
    unique('deck_subscriptions_user_id_deck_id_unique').on(table.userId, table.deckId),
    index('deck_subscriptions_deck_id_idx').on(table.deckId),
  ],
);

export const lessons = pgTable(
  'lessons',
  {
    id: serial('id').primaryKey(),
    deckId: integer('deck_id')
      .notNull()
      .references(() => decks.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => [index('lessons_deck_id_order_index_idx').on(table.deckId, table.orderIndex)],
);

export const vocabs = pgTable(
  'vocabs',
  {
    id: serial('id').primaryKey(),
    sourceVocabId: integer('source_vocab_id').references((): AnyPgColumn => vocabs.id, {
      onDelete: 'set null',
    }),
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
    tags: varchar('tags', { length: 64 })
      .array()
      .default(sql`ARRAY[]::varchar[]`)
      .notNull(),
    metadata: jsonb('metadata')
      .$type<VocabMetadata>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    notes: text('notes'),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => [
    index('vocabs_lesson_id_order_index_idx').on(table.lessonId, table.orderIndex),
    index('vocabs_source_vocab_id_idx').on(table.sourceVocabId),
  ],
);

export const userVocabState = pgTable(
  'user_vocab_state',
  {
    id: serial('id').primaryKey(),

    userId: uuid('user_id').notNull(),
    vocabId: integer('vocab_id')
      .notNull()
      .references(() => vocabs.id, { onDelete: 'cascade' }),

    srsLevel: integer('srs_level').default(0).notNull(),
    dueAt: timestamp('due_at').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => [
    unique('user_vocab_state_user_id_vocab_id_unique').on(table.userId, table.vocabId),
    index('user_vocab_state_user_id_due_at_idx').on(table.userId, table.dueAt),
    check('user_vocab_state_srs_level_range', sql`${table.srsLevel} between 0 and 8`),
  ],
);

export const feedback = pgTable(
  'feedback',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    category: varchar('category', { length: 40 }).notNull(),
    message: text('message').notNull(),
    pagePath: varchar('page_path', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 320 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => [index('feedback_created_at_idx').on(table.createdAt)],
);
