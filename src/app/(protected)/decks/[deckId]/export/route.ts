import { getOwnedDeckExport } from '@/db/queries/deck-export.queries';
import { buildDeckCsv, downloadFilename } from '@/lib/deck-export/csv';
import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';

type Context = { params: Promise<{ deckId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return new Response('Authentication required.', { status: 401 });

  const deckId = parsePositiveInteger((await params).deckId);
  if (!deckId) return new Response('Deck not found.', { status: 404 });

  const data = await getOwnedDeckExport(deckId, userId);
  if (!data) return new Response('Deck not found.', { status: 404 });

  return new Response(buildDeckCsv(data.rows), {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="${downloadFilename(data.deck.title, 'csv')}"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
}
