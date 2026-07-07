import { feedback } from '@/db/schema';

export type Feedback = typeof feedback.$inferSelect;
export type CreateFeedback = typeof feedback.$inferInsert;

export type FeedbackCategory = 'bug' | 'confusing' | 'feature' | 'content' | 'other';

export type CreateFeedbackInput = {
  category: FeedbackCategory;
  message: string;
  pagePath?: string | null;
  contactEmail?: string | null;
};
