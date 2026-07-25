import PublicDeckBrowser from '@/app/public/decks/_components/public-deck-browser';
import PublicDecksAccountAction from '@/app/public/decks/_components/public-decks-account-action';
import { getCachedPublicDeckSummaries } from '@/db/queries/public-deck.queries';

export default async function PublicDeckResults() {
  const decks = await getCachedPublicDeckSummaries();

  return decks.length > 0 ? (
    <section aria-labelledby="available-decks-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="available-decks-heading" className="text-2xl font-semibold">
            Available decks
          </h2>
          <p className="mt-1 text-sm text-default-500">
            Open any deck to try a card and see how the material is organized. Follow it when you
            are ready to save progress.
          </p>
        </div>
        <PublicDecksAccountAction />
      </div>
      <PublicDeckBrowser decks={decks} />
    </section>
  ) : (
    <section className="rounded-xl border border-default-200 bg-default-50 px-6 py-10 text-center">
      <h2 className="text-xl font-semibold">Public decks are coming soon</h2>
      <p className="mt-2 text-default-500">
        Create an account to build your own flashcard decks in the meantime.
      </p>
      <div className="mt-5 flex justify-center">
        <PublicDecksAccountAction />
      </div>
    </section>
  );
}
