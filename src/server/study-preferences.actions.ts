'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { lessonUnlocks, studyPreferences } from '@/db/schema';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { validateStudyPreferences, type StudyPreferences } from '@/lib/study-preferences';
import { getLessonProgressForDeck } from '@/db/queries/review.queries';
import { getActiveReleaseId } from '@/db/queries/deck-access';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';

export async function saveStudyPreferencesAction(input: StudyPreferences) {
  const preferences = validateStudyPreferences(input);
  const userId = await getCurrentUserId();
  await db
    .insert(studyPreferences)
    .values({ userId, ...preferences })
    .onConflictDoUpdate({
      target: studyPreferences.userId,
      set: preferences,
    });
  revalidatePath('/', 'layout');
}

export async function continueToLessonAction(deckIdInput: number, lessonIdInput: number) {
  const deckId = parsePositiveInteger(deckIdInput);
  const lessonId = parsePositiveInteger(lessonIdInput);
  if (!deckId || !lessonId) throw new Error('Invalid lesson.');
  const userId = await getCurrentUserId();
  if (!(await getActiveReleaseId(deckId, userId))) throw new Error('Deck unavailable.');
  const progress = await getLessonProgressForDeck(deckId, userId);
  const lesson = progress.find(item => item.lessonId === lessonId);
  if (!lesson) throw new Error('Lesson unavailable.');
  if (!lesson.isUnlocked && !lesson.canContinueEarly) {
    throw new Error(
      'Strengthen the previous lesson before continuing, or choose Guided progression in Account.',
    );
  }
  await db.insert(lessonUnlocks).values({ userId, lessonId }).onConflictDoNothing();
  revalidatePath('/', 'layout');
}
