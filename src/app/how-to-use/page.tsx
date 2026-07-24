import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to use Ordlys',
  description: 'A simple guide to getting the most out of spaced repetition.',
  alternates: { canonical: '/how-to-use' },
};

export default function HowToUsePage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">How to use spaced repetition</h1>
      <p className="mt-4">
        Spaced repetition helps you remember things by bringing them back just before you are likely
        to forget. You do not need to manage the timing yourself. Study a little, return regularly,
        and let the app decide what is worth reviewing next.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Start small</h2>
      <p className="mt-2">
        Choose one useful deck and learn a manageable number of new words at a time. Adding too much
        at once creates a large review queue later. A short session you can repeat is more useful
        than a long session that leaves you exhausted.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Try to recall before revealing the answer</h2>
      <p className="mt-2">
        Pause and make a real attempt, even when you are unsure. The effort of pulling an answer
        from memory is part of what makes it stick. Practising both directions also helps you move
        from simply recognizing a word to being able to use it yourself.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Be honest when you forget</h2>
      <p className="mt-2">
        Getting something wrong is normal. It tells the app to show that card sooner, which is
        exactly what you want. There is no need to protect a score or rush a word into a higher
        level.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Keep a steady rhythm</h2>
      <p className="mt-2">
        Review due cards regularly before adding lots of new material. Daily practice is helpful,
        but missing a day is not a failure. Just pick up where you left off. Over time, familiar
        words will appear less often while difficult ones return sooner.
      </p>

      <h2 className="mt-8 text-xl font-semibold">What to expect</h2>
      <p className="mt-2">
        The first few days can feel repetitive because new material needs close reviews. The gaps
        grow as your memory strengthens. Progress may feel gradual, but regular recall adds up. Aim
        for useful, lasting memory rather than a perfect streak.
      </p>
    </article>
  );
}
