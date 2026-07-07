import { db } from '@/db';
import { feedback } from '@/db/schema';
import { CreateFeedback } from '@/types/feedback.types';

export async function createFeedback(input: CreateFeedback): Promise<void> {
  await db.insert(feedback).values(input);
}
