'use server';

import { importDeck } from '@/db/queries/deck-import.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { CSV_IMPORT_LIMITS, parseDeckCsv } from '@/lib/deck-import/csv';
import {
  CONTENT_LIMITS,
  optionalLanguageTag,
  optionalText,
  requiredText,
} from '@/lib/validation/content';
import { revalidatePath } from 'next/cache';
import { UserFacingError, withExpectedError } from '@/lib/action-result';
import { errorMessage } from '@/lib/validation/content';
import { parseDeckStudyDirection } from '@/lib/deck-study-direction';

export async function importCsvDeckAction(formData: FormData) {
  return withExpectedError(async () => {
    const userId = await getCurrentUserId();
    const file = formData.get('file');
    if (!(file instanceof File) || !file.name)
      throw new UserFacingError('INVALID_IMPORT', 'Choose a CSV file to import.');
    if (file.size > CSV_IMPORT_LIMITS.fileBytes)
      throw new UserFacingError('INVALID_IMPORT', 'The CSV file must be 2 MB or smaller.');
    if (!file.name.toLowerCase().endsWith('.csv'))
      throw new UserFacingError('INVALID_IMPORT', 'The import file must be a .csv.');

    let rows;
    try {
      rows = parseDeckCsv(await file.text());
    } catch (error) {
      throw new UserFacingError('INVALID_CSV', errorMessage(error, 'The CSV could not be parsed.'));
    }
    const deckId = await importDeck(
      {
        ownerId: userId,
        title: requiredText(formData.get('title'), 'Deck title', CONTENT_LIMITS.deckTitle),
        description: optionalText(
          formData.get('description'),
          'Description',
          CONTENT_LIMITS.deckDescription,
        ),
        frontLanguage: optionalLanguageTag(formData.get('frontLanguage'), 'Front language'),
        backLanguage: optionalLanguageTag(formData.get('backLanguage'), 'Back language'),
        studyDirection: parseDeckStudyDirection(formData.get('studyDirection')),
        visibility: 'private',
      },
      rows,
    );

    revalidatePath('/decks');
    return deckId;
  });
}
