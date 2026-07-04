import { getLessonProgressForDeck } from '@/db/queries/review.queries';
import { cache } from 'react';

export const getCachedLessonProgress = cache(getLessonProgressForDeck);
