'use server';

import { createDeck, updateDeck } from '@/db/queries/deck.queries';
import { changeDeckStatus } from '@/db/queries/deck-release.queries';
import { CreateDeck, CreateDeckInput } from '@/types/deck.types';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import {
  CONTENT_LIMITS,
  optionalLanguageTag,
  optionalText,
  requiredText,
} from '@/lib/validation/content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { withExpectedError } from '@/lib/action-result';
import { PUBLIC_DECK_SUMMARIES_CACHE_TAG } from '@/lib/cache-tags';
import { parseDeckStudyDirection } from '@/lib/deck-study-direction';

export async function createDeckAction(deck: CreateDeckInput, firstLessonTitle: string) {
  return withExpectedError(async () => {
    const userId = await getCurrentUserId();
    if (!deck || typeof deck !== 'object') throw new Error('Invalid deck.');
    const deckWithOwner: CreateDeck = {
      title: requiredText(deck.title, 'Deck title', CONTENT_LIMITS.deckTitle),
      description: optionalText(deck.description, 'Description', CONTENT_LIMITS.deckDescription),
      frontLanguage: optionalLanguageTag(deck.frontLanguage, 'Front language'),
      backLanguage: optionalLanguageTag(deck.backLanguage, 'Back language'),
      studyDirection: parseDeckStudyDirection(deck.studyDirection),
      // New authoring workspaces are always private. Publishing/sharing is a separate transition.
      visibility: 'private',
      ownerId: userId,
    };

    const createdWorkspace = await createDeck(
      deckWithOwner,
      requiredText(firstLessonTitle, 'First lesson title', CONTENT_LIMITS.lessonTitle),
    );
    revalidatePath('/decks');
    return createdWorkspace;
  });
}

export async function updateDeckAction(id: number, input: Omit<CreateDeckInput, 'visibility'>) {
  return withExpectedError(async () => {
    const deckId = parsePositiveInteger(id);
    if (!deckId || !input || typeof input !== 'object') throw new Error('Invalid deck.');
    const userId = await getCurrentUserId();
    await updateDeck(deckId, userId, {
      title: requiredText(input.title, 'Deck title', CONTENT_LIMITS.deckTitle),
      description: optionalText(input.description, 'Description', CONTENT_LIMITS.deckDescription),
      frontLanguage: optionalLanguageTag(input.frontLanguage, 'Front language'),
      backLanguage: optionalLanguageTag(input.backLanguage, 'Back language'),
      studyDirection: parseDeckStudyDirection(input.studyDirection),
    });
    revalidatePath('/decks');
    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/edit`);
    revalidatePath('/discover');
    revalidateTag(PUBLIC_DECK_SUMMARIES_CACHE_TAG);
  });
}

export async function deleteDeckAction(id: number) {
  return withExpectedError(async () => {
    const deckId = parsePositiveInteger(id);
    if (!deckId) throw new Error('Invalid deck ID.');
    await changeDeckStatus(deckId, await getCurrentUserId(), 'deleted');
    revalidateTag(PUBLIC_DECK_SUMMARIES_CACHE_TAG);
    revalidatePath('/decks');
    revalidatePath('/dashboard');
    revalidatePath('/progress');
    revalidatePath('/discover');
  });
}
