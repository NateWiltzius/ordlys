import { getLessonProgressData } from '@/server/data/review-page-data';
import { cache } from 'react';

export const getCachedLessonProgress = cache(getLessonProgressData);
