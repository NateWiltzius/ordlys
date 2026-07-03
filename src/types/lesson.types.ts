import { lessons } from '@/db/schema';

export type CreateLesson = typeof lessons.$inferInsert;

export type Lesson = typeof lessons.$inferSelect;
