import { getLessonProgressForDeckAction } from '@/server/review.actions';
import { cache } from 'react';

export const getCachedLessonProgress = cache(getLessonProgressForDeckAction);
