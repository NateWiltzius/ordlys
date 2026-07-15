export type StudyTone = 'learning' | 'review' | 'practice' | 'neutral';

export const STUDY_TONE_STYLES = {
  learning: {
    surface: 'border-blue-500/30 bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    accent: 'bg-blue-600 text-white',
    button: 'bg-blue-600 text-white hover:bg-blue-700',
    progress: 'bg-blue-600',
  },
  review: {
    surface: 'border-success/30 bg-success/10',
    text: 'text-success',
    accent: 'bg-success text-white',
    button: 'bg-success text-white hover:bg-success/90',
    progress: 'bg-success',
  },
  practice: {
    surface: 'border-violet-500/30 bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
    accent: 'bg-violet-600 text-white',
    button: 'bg-violet-600 text-white hover:bg-violet-700',
    progress: 'bg-violet-600',
  },
  neutral: {
    surface: 'border-default-200 bg-default-50',
    text: 'text-primary',
    accent: 'bg-primary text-white',
    button: '',
    progress: 'bg-primary',
  },
} satisfies Record<StudyTone, Record<string, string>>;

export const QUIZ_FEEDBACK_STYLES = {
  correct: {
    surface: 'border-success/30 bg-success/10',
    text: 'text-success',
    button: 'bg-success text-white hover:bg-success/90',
  },
  incorrect: {
    surface: 'border-danger/30 bg-danger/10',
    text: 'text-danger',
    button: 'bg-danger text-white hover:bg-danger/90',
  },
} as const;
