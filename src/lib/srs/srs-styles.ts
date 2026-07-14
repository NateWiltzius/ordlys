import type { SrsCategoryKey } from './srs-config';

type SrsCategoryStyle = {
  bar: string;
  dot: string;
  surface: string;
  text: string;
  chip: string;
};

export const SRS_CATEGORY_STYLES: Record<SrsCategoryKey, SrsCategoryStyle> = {
  learning: {
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
    surface: 'border-blue-500/25 bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    chip: 'border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300',
  },
  strong: {
    bar: 'bg-violet-500',
    dot: 'bg-violet-500',
    surface: 'border-violet-500/25 bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
    chip: 'border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300',
  },
  mature: {
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    surface: 'border-amber-500/25 bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    chip: 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  mastered: {
    bar: 'bg-success',
    dot: 'bg-success',
    surface: 'border-success/25 bg-success/10',
    text: 'text-success',
    chip: 'border-success/30 bg-success/15 text-success',
  },
};
