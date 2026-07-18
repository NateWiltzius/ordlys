import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How Ordlys stores, uses, and retains account and learning data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  const operatorName = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || 'the Ordlys site owner';
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

  return (
    <article className="prose mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Privacy notice</h1>
      <p className="mt-4">
        Ordlys is operated by {operatorName}, who is responsible for the personal data described in
        this notice.
      </p>
      <p className="mt-4">
        Ordlys stores your email address for authentication and your decks, followed decks,
        vocabulary, and learning history to provide study and review features. If you submit
        feedback, Ordlys also stores the message, category, related page, and any contact email you
        choose to provide.
      </p>
      <h2 className="mt-8 text-xl font-semibold">How data is used</h2>
      <p className="mt-2">
        We use this information only to operate, secure, and improve the service. Public deck
        titles, descriptions, lesson outlines, and sample vocabulary can be viewed without an
        account and may be indexed by search engines. Private decks are restricted to you.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Service providers and analytics</h2>
      <p className="mt-2">
        Supabase provides authentication, and the application and database infrastructure process
        the information needed to operate Ordlys. Vercel Analytics measures visits and product usage
        so we can understand reliability and improve the service. We do not sell your personal
        information.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Retention and control</h2>
      <p className="mt-2">
        Your data is retained while your account exists. You can delete individual vocabulary,
        lessons, and decks using their corresponding controls, or permanently delete your account
        from the account page. Account deletion removes your authentication account, follows,
        reports, and learning history. Authored deck releases and their content may be retained
        without your account identifier when needed to preserve release history, attribution chains,
        or study material used by other learners.
      </p>
      <p className="mt-2">
        You can download your account data from the account page and export any deck you own as a
        reusable CSV file from its deck page. For a privacy or data request, use the public{' '}
        <a href="/feedback" className="text-primary underline">
          contact page
        </a>
        {contactEmail ? (
          <>
            {' '}
            or email{' '}
            <a href={`mailto:${contactEmail}`} className="text-primary underline">
              {contactEmail}
            </a>
          </>
        ) : null}
        .
      </p>
      <p className="mt-8 text-sm text-default-500">Effective July 17, 2026.</p>
    </article>
  );
}
