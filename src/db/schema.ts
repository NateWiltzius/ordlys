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

export const visibilityEnum = pgEnum('visibility', ['private', 'unlisted', 'public']);
export const deckStatusEnum = pgEnum('deck_status', [
  'active',
  'archived',
  'deleted',
  'moderation_removed',
]);
export const copyPolicyEnum = pgEnum('copy_policy', [
  'follow_only',
  'private_forks',
  'public_forks',
]);
export const catalogStatusEnum = pgEnum('catalog_status', [
  'eligible',
  'duplicate',
  'hidden',
  'under_review',
]);
export const followUpdateModeEnum = pgEnum('follow_update_mode', ['automatic', 'manual']);
export const followStatusEnum = pgEnum('follow_status', ['active', 'unfollowed', 'frozen']);
export const studyModeEnum = pgEnum('study_mode', ['learn', 'review', 'placement']);
export const quizDirectionEnum = pgEnum('quiz_direction', ['btf', 'ftb']);

export const decks = pgTable(
  'decks',
  {
    id: serial('id').primaryKey(),
    ownerId: uuid('owner_id').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }),
    frontLanguage: varchar('front_language', { length: 35 }),
    backLanguage: varchar('back_language', { length: 35 }),
    visibility: visibilityEnum().default('private').notNull(),
    status: deckStatusEnum().default('active').notNull(),
    copyPolicy: copyPolicyEnum('copy_policy').default('follow_only').notNull(),
    catalogStatus: catalogStatusEnum('catalog_status').default('eligible').notNull(),
    rootDeckId: integer('root_deck_id').references((): AnyPgColumn => decks.id),
    sourceReleaseId: integer('source_release_id').references((): AnyPgColumn => deckReleases.id),
    currentReleaseId: integer('current_release_id').references((): AnyPgColumn => deckReleases.id),
    retentionUntil: timestamp('retention_until'),
    sourceDeckId: integer('source_deck_id').references((): AnyPgColumn => decks.id, {
      onDelete: 'set null',
    }),
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

export const lessons = pgTable(
  'lessons',
  {
    id: serial('id').primaryKey(),
    deckId: integer('deck_id')
      .notNull()
      .references(() => decks.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    currentRevisionId: integer('current_revision_id').references(
      (): AnyPgColumn => lessonRevisions.id,
    ),
    removedAt: timestamp('removed_at'),
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
    rootVocabId: integer('root_vocab_id').references((): AnyPgColumn => vocabs.id),
    currentRevisionId: integer('current_revision_id').references(
      (): AnyPgColumn => vocabRevisions.id,
    ),
    removedAt: timestamp('removed_at'),
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
    frontToBackQuizHint: varchar('front_to_back_quiz_hint', { length: 255 }),
    backToFrontQuizHint: varchar('back_to_front_quiz_hint', { length: 255 }),
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

export const lessonRevisions = pgTable(
  'lesson_revisions',
  {
    id: serial('id').primaryKey(),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id),
    title: varchar('title', { length: 255 }).notNull(),
    creatorId: uuid('creator_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => [index('lesson_revisions_lesson_id_idx').on(table.lessonId)],
);

export const vocabRevisions = pgTable(
  'vocab_revisions',
  {
    id: serial('id').primaryKey(),
    vocabId: integer('vocab_id')
      .notNull()
      .references(() => vocabs.id),
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
    frontToBackQuizHint: varchar('front_to_back_quiz_hint', { length: 255 }),
    backToFrontQuizHint: varchar('back_to_front_quiz_hint', { length: 255 }),
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
    creatorId: uuid('creator_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => [index('vocab_revisions_vocab_id_idx').on(table.vocabId)],
);

export const deckReleases = pgTable(
  'deck_releases',
  {
    id: serial('id').primaryKey(),
    deckId: integer('deck_id')
      .notNull()
      .references(() => decks.id),
    version: integer('version').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }),
    copyPolicy: copyPolicyEnum('copy_policy').notNull(),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    changeSummary: text('change_summary').notNull(),
    derivedFromReleaseId: integer('derived_from_release_id').references(
      (): AnyPgColumn => deckReleases.id,
    ),
    creatorId: uuid('creator_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => [
    unique('deck_releases_deck_version_unique').on(table.deckId, table.version),
    index('deck_releases_hash_idx').on(table.contentHash),
  ],
);

export const releaseLessons = pgTable(
  'release_lessons',
  {
    releaseId: integer('release_id')
      .notNull()
      .references(() => deckReleases.id),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id),
    revisionId: integer('revision_id')
      .notNull()
      .references(() => lessonRevisions.id),
    orderIndex: integer('order_index').notNull(),
  },
  table => [
    unique('release_lessons_release_lesson_unique').on(table.releaseId, table.lessonId),
    index('release_lessons_release_order_idx').on(table.releaseId, table.orderIndex),
  ],
);

export const releaseVocabs = pgTable(
  'release_vocabs',
  {
    releaseId: integer('release_id')
      .notNull()
      .references(() => deckReleases.id),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id),
    vocabId: integer('vocab_id')
      .notNull()
      .references(() => vocabs.id),
    revisionId: integer('revision_id')
      .notNull()
      .references(() => vocabRevisions.id),
    orderIndex: integer('order_index').notNull(),
  },
  table => [
    unique('release_vocabs_release_vocab_unique').on(table.releaseId, table.vocabId),
    index('release_vocabs_release_lesson_order_idx').on(
      table.releaseId,
      table.lessonId,
      table.orderIndex,
    ),
  ],
);

export const deckFollows = pgTable(
  'deck_follows',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    deckId: integer('deck_id')
      .notNull()
      .references(() => decks.id),
    updateMode: followUpdateModeEnum('update_mode').default('automatic').notNull(),
    pinnedReleaseId: integer('pinned_release_id').references(() => deckReleases.id),
    lastSeenReleaseId: integer('last_seen_release_id').references(() => deckReleases.id),
    status: followStatusEnum().default('active').notNull(),
    followedAt: timestamp('followed_at').defaultNow().notNull(),
    unfollowedAt: timestamp('unfollowed_at'),
  },
  table => [
    unique('deck_follows_user_deck_unique').on(table.userId, table.deckId),
    index('deck_follows_deck_status_idx').on(table.deckId, table.status),
    index('deck_follows_user_status_idx').on(table.userId, table.status),
  ],
);

export const deckAuditEvents = pgTable(
  'deck_audit_events',
  {
    id: serial('id').primaryKey(),
    deckId: integer('deck_id').references(() => decks.id),
    actorId: uuid('actor_id'),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    metadata: jsonb('metadata')
      .$type<VocabMetadata>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 128 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => [
    unique('deck_audit_actor_event_key_unique').on(
      table.actorId,
      table.eventType,
      table.idempotencyKey,
    ),
  ],
);

export const deckReports = pgTable(
  'deck_reports',
  {
    id: serial('id').primaryKey(),
    deckId: integer('deck_id')
      .notNull()
      .references(() => decks.id),
    reporterId: uuid('reporter_id').notNull(),
    reason: varchar('reason', { length: 64 }).notNull(),
    details: text('details'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => [unique('deck_reports_reporter_deck_unique').on(table.reporterId, table.deckId)],
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

export const reviewAttempts = pgTable(
  'review_attempts',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    vocabId: integer('vocab_id')
      .notNull()
      .references(() => vocabs.id, { onDelete: 'cascade' }),
    mode: studyModeEnum().notNull(),
    direction: quizDirectionEnum().notNull(),
    isCorrect: boolean('is_correct').notNull(),
    wasOverridden: boolean('was_overridden').default(false).notNull(),
    sessionId: uuid('session_id').notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 128 }),
    attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
  },
  table => [
    index('review_attempts_user_attempted_at_idx').on(table.userId, table.attemptedAt),
    index('review_attempts_user_correct_attempted_at_idx').on(
      table.userId,
      table.isCorrect,
      table.attemptedAt,
    ),
    index('review_attempts_vocab_id_idx').on(table.vocabId),
    index('review_attempts_session_card_idx').on(
      table.userId,
      table.sessionId,
      table.vocabId,
      table.mode,
      table.attemptedAt,
    ),
    unique('review_attempts_user_idempotency_key_unique').on(table.userId, table.idempotencyKey),
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
  table => [
    index('feedback_created_at_idx').on(table.createdAt),
    index('feedback_user_id_idx').on(table.userId),
  ],
);
