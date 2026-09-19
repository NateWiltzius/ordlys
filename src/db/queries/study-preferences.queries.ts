import { and, count, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { lessonUnlocks, studyPreferences, userVocabState } from '@/db/schema';
import { DEFAULT_STUDY_PREFERENCES } from '@/lib/study-preferences';

export async function getStudyPreferences(userId: string) {
  const [preferences] = await db
    .select()
    .from(studyPreferences)
    .where(eq(studyPreferences.userId, userId));
  return preferences ?? DEFAULT_STUDY_PREFERENCES;
}

export async function getLessonProgressOptions(userId: string) {
  const [preferences, unlocks] = await Promise.all([
    getStudyPreferences(userId),
    db
      .select({ lessonId: lessonUnlocks.lessonId })
      .from(lessonUnlocks)
      .where(eq(lessonUnlocks.userId, userId)),
  ]);
  return {
    strictProgression: preferences.strictProgression,
    unlockedLessonIds: unlocks.map(row => row.lessonId),
  };
}

export async function getDailyStudyProgress(userId: string) {
  const preferences = await getStudyPreferences(userId);
  // created_at is a UTC timestamp without time zone, like the rest of the schema.
  const [row] = await db
    .select({ introducedToday: count() })
    .from(userVocabState)
    .where(
      and(
        eq(userVocabState.userId, userId),
        sql`(${userVocabState.createdAt} at time zone 'UTC' at time zone ${preferences.timeZone})::date = (now() at time zone ${preferences.timeZone})::date`,
      ),
    );
  return { ...preferences, introducedToday: Number(row.introducedToday) };
}
