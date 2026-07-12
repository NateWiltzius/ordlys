'use server';

import { createFeedback } from '@/db/queries/feedback.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { CONTENT_LIMITS, optionalText, requiredText } from '@/lib/validation/content';
import { CreateFeedbackInput, FeedbackCategory } from '@/types/feedback.types';
import { UserFacingError, withExpectedError } from '@/lib/action-result';

const FEEDBACK_CATEGORIES = new Set<FeedbackCategory>([
  'bug',
  'confusing',
  'feature',
  'content',
  'other',
]);

export async function createFeedbackAction(input: CreateFeedbackInput) {
  return withExpectedError(async () => {
    if (!input || typeof input !== 'object') throw new Error('Invalid feedback.');
    if (!FEEDBACK_CATEGORIES.has(input.category))
      throw new UserFacingError('VALIDATION_ERROR', 'Choose a feedback type.');

    const message = requiredText(input.message, 'Feedback', CONTENT_LIMITS.feedbackMessage);
    const pagePath = optionalText(input.pagePath, 'Page or flow', CONTENT_LIMITS.feedbackPagePath);
    const contactEmail = optionalText(
      input.contactEmail,
      'Contact email',
      CONTENT_LIMITS.feedbackContactEmail,
    );

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      throw new UserFacingError('VALIDATION_ERROR', 'Contact email must be a valid email address.');
    }

    await createFeedback({
      userId: await getCurrentUserId(),
      category: input.category,
      message,
      pagePath,
      contactEmail,
    });
  });
}
