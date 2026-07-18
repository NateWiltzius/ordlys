import PublicDeckBrowser from '@/app/public/decks/_components/public-deck-browser';
import ButtonLink from '@/components/shared/button-link';
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
            Preview any deck without an account. An account is required to study and save progress.
          </p>
        </div>
        <ButtonLink href="/auth/sign-up" size="sm">
          Create an account
        </ButtonLink>
      </div>
      <PublicDeckBrowser decks={decks} />
    </section>
  ) : (
    <section className="rounded-xl border border-default-200 bg-default-50 px-6 py-10 text-center">
      <h2 className="text-xl font-semibold">Public decks are coming soon</h2>
      <p className="mt-2 text-default-500">
        Create an account to build your own vocabulary decks in the meantime.
      </p>
      <ButtonLink href="/auth/sign-up" className="mt-5">
        Start learning
      </ButtonLink>
    </section>
  );
}
