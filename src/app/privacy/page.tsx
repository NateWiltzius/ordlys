import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How Ordlys stores, uses, and retains account and learning data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <article className="prose mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Privacy notice</h1>
      <p className="mt-4">
        Ordlys stores your email address for authentication and your decks, followed decks,
        vocabulary, and learning history to provide study and review features.
      </p>
      <h2 className="mt-8 text-xl font-semibold">How data is used</h2>
      <p className="mt-2">
        We use this information only to operate, secure, and improve the service. Public deck
        titles, descriptions, lesson outlines, and sample vocabulary can be viewed without an
        account and may be indexed by search engines. Private decks are restricted to you.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Retention and control</h2>
      <p className="mt-2">
        Your data is retained while your account exists. You can delete individual vocabulary,
        lessons, and decks using their corresponding controls, or permanently delete your account
        from the account page. Public decks with active followers may be retained in an archived,
        read-only form so those learners keep access to their study material.
      </p>
      <p className="mt-8 text-sm text-default-500">Effective July 5, 2026.</p>
    </article>
  );
}
