import FeaturedPublicDecks from '@/app/_components/featured-public-decks';
import FeaturedPublicDecksLoading from '@/app/_components/featured-public-decks-loading';
import HomepagePrimaryAction from '@/app/_components/homepage-primary-action';
import HomepageQuizPreview from '@/app/_components/homepage-quiz-preview';
import ButtonLink from '@/components/shared/button-link';
import { absoluteUrl, OPEN_GRAPH_IMAGE, TWITTER_IMAGE } from '@/lib/site';
import { headers } from 'next/headers';
import { ArrowPathRoundedSquareIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Chip } from '@heroui/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';

const title = 'Ordlys – Spaced Repetition Flashcards for Any Subject';
const description =
  'Create or follow flashcard decks for any language or subject, practise active recall, and review each card on a schedule that adapts to your memory.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Ordlys',
    title,
    description,
    images: [OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [TWITTER_IMAGE],
  },
};

export default async function Home() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Ordlys',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: absoluteUrl('/'),
    description,
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-4">
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
        }}
      />

      <section className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
        <div>
          <p className="text-sm font-semibold text-success">Spaced repetition for any deck</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Remember what you learn, one card at a time.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-default-500">
            Follow a ready-made deck or build your own for any language or subject. Ordlys keeps
            track of what is new, what needs work, and what is ready to review today.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <HomepagePrimaryAction />
            <ButtonLink href="/public/decks" variant="secondary" size="lg">
              Browse public decks
            </ButtonLink>
          </div>

          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-default-200 pt-5 text-sm">
            <div>
              <dt className="text-default-500">Material</dt>
              <dd className="mt-1 font-semibold">Any language or subject</dd>
            </div>
            <div>
              <dt className="text-default-500">Study</dt>
              <dd className="mt-1 font-semibold">Type the answer</dd>
            </div>
            <div>
              <dt className="text-default-500">Review</dt>
              <dd className="mt-1 font-semibold">Scheduled automatically</dd>
            </div>
          </dl>
        </div>

        <TodayPreview />
      </section>

      <section
        aria-labelledby="study-rhythm-heading"
        className="border-y border-default-200 py-10 sm:py-14"
      >
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div>
            <p className="text-sm font-semibold text-primary">A manageable study rhythm</p>
            <h2
              id="study-rhythm-heading"
              className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Open Ordlys. Do what is ready. Stop when you are done.
            </h2>
            <p className="mt-4 leading-7 text-default-500">
              There is no review calendar to maintain by hand. New cards and due reviews stay
              separate, so you can keep learning without losing track of older material.
            </p>
          </div>

          <ol className="divide-y divide-default-200 border-y border-default-200">
            <StudyStep
              number="01"
              title="Learn a few new cards"
              description="Work through a lesson in both directions, from the front of each card to the back and back again."
            />
            <StudyStep
              number="02"
              title="Review what is due"
              description="Each completed card returns on its own schedule. Difficult cards come back sooner."
            />
            <StudyStep
              number="03"
              title="Revisit recent mistakes"
              description="Practise cards you missed without changing their normal review schedule."
            />
          </ol>
        </div>
      </section>

      <section
        id="try-a-word"
        aria-labelledby="try-a-word-heading"
        className="grid scroll-mt-24 gap-10 py-12 sm:py-16 lg:grid-cols-[0.78fr_1.22fr] lg:items-start"
      >
        <div className="lg:sticky lg:top-28">
          <p className="text-sm font-semibold text-primary">One deck example</p>
          <h2
            id="try-a-word-heading"
            className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Try it with a Norwegian word.
          </h2>
          <p className="mt-4 leading-7 text-default-500">
            Typing an answer makes you retrieve the card from memory. This example uses Norwegian,
            but the same front-and-back flow works with any language or subject.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <FeatureLine>Common alternative answers are accepted.</FeatureLine>
            <FeatureLine>A missed direction returns later in the session.</FeatureLine>
            <FeatureLine>Review timing changes as recall improves.</FeatureLine>
          </ul>
        </div>

        <HomepageQuizPreview />
      </section>

      <section
        aria-labelledby="progress-heading"
        className="grid gap-10 border-y border-default-200 py-12 sm:py-16 lg:grid-cols-2 lg:items-center"
      >
        <ProgressPreview />

        <div className="lg:pl-8">
          <p className="text-sm font-semibold text-primary">Progress you can inspect</p>
          <h2
            id="progress-heading"
            className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            See what is sticking, not just how often you showed up.
          </h2>
          <p className="mt-4 leading-7 text-default-500">
            Follow the number of cards you have started, how many have become strong, recent answer
            accuracy, and the work still waiting in each deck.
          </p>
          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5">
            <div className="border-t border-default-200 pt-3">
              <dt className="text-sm text-default-500">Memory</dt>
              <dd className="mt-1 font-semibold">Learning to mastered</dd>
            </div>
            <div className="border-t border-default-200 pt-3">
              <dt className="text-sm text-default-500">Activity</dt>
              <dd className="mt-1 font-semibold">Cards practised by day</dd>
            </div>
            <div className="border-t border-default-200 pt-3">
              <dt className="text-sm text-default-500">Accuracy</dt>
              <dd className="mt-1 font-semibold">Based on real answers</dd>
            </div>
            <div className="border-t border-default-200 pt-3">
              <dt className="text-sm text-default-500">Deck coverage</dt>
              <dd className="mt-1 font-semibold">Started and remaining</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="public-decks-heading" className="py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">Public decks and your own material</p>
            <h2
              id="public-decks-heading"
              className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Follow a deck, adapt a copy, or start from scratch.
            </h2>
            <p className="mt-3 leading-7 text-default-500">
              Norwegian is the first ready-made collection in Ordlys. Your own decks can cover any
              language or subject, and you can create them by hand or import a CSV.
            </p>
          </div>
          <ButtonLink href="/public/decks" variant="secondary">
            Browse public decks
          </ButtonLink>
        </div>

        <div className="mt-7">
          <Suspense fallback={<FeaturedPublicDecksLoading />}>
            <FeaturedPublicDecks />
          </Suspense>
        </div>
      </section>

      <section className="border-t border-default-200 py-12 text-center sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Chip size="sm" variant="soft" color="success">
            Any language or subject
          </Chip>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Bring the material you want to remember.
          </h2>
          <p className="mt-3 leading-7 text-default-500">
            Create a deck from scratch, import a CSV, or follow a public collection. Ordlys keeps
            the study queue and review schedule from there.
          </p>
          <div className="mt-6 flex justify-center">
            <HomepagePrimaryAction />
          </div>
          <p className="mt-5 text-sm text-default-500">
            Ordlys is an independent project. Questions or rough edges?{' '}
            <Link href="/feedback" className="font-medium text-primary underline">
              Send feedback
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

function TodayPreview() {
  const bars = [16, 28, 18, 46, 32, 72, 54, 38, 64, 26, 42, 20];

  return (
    <section
      aria-label="Example Ordlys daily study plan"
      className="rounded-lg border border-default-200 bg-default-50"
    >
      <header className="flex items-start justify-between gap-4 border-b border-default-200 px-5 py-4">
        <div>
          <p className="font-semibold">Today</p>
          <p className="mt-1 text-sm text-default-500">Across your active decks</p>
        </div>
        <Chip size="sm" variant="soft" color="success">
          Example plan
        </Chip>
      </header>

      <div className="divide-y divide-default-200">
        <PreviewAction
          icon={<ClockIcon className="size-5" aria-hidden="true" />}
          tone="review"
          title="Review due cards"
          detail="12 cards are ready"
          action="Start review"
        />
        <PreviewAction
          icon={<CheckIcon className="size-5" aria-hidden="true" />}
          tone="learning"
          title="Learn new cards"
          detail="10 cards in the next lesson"
          action="Start learning"
        />
        <PreviewAction
          icon={<ArrowPathRoundedSquareIcon className="size-5" aria-hidden="true" />}
          tone="practice"
          title="Extra practice"
          detail="4 recent mistakes"
          action="Practise"
        />
      </div>

      <div className="border-t border-default-200 px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Next 24 hours</p>
            <p className="mt-1 text-xs text-default-500">Reviews appear when they are due.</p>
          </div>
          <p className="text-xs text-default-500">18 scheduled</p>
        </div>
        <div className="mt-4 flex h-16 items-end gap-1" aria-hidden="true">
          {bars.map((height, index) => (
            <span
              key={index}
              className="flex-1 rounded-t-sm bg-success/70"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewAction({
  icon,
  tone,
  title,
  detail,
  action,
}: {
  icon: ReactNode;
  tone: 'learning' | 'review' | 'practice';
  title: string;
  detail: string;
  action: string;
}) {
  const toneClasses = {
    learning: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    review: 'bg-success/10 text-success',
    practice: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  };

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-default-500">{detail}</p>
      </div>
      <span className="hidden text-sm font-medium text-primary sm:block">{action}</span>
    </div>
  );
}

function StudyStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <li className="grid gap-3 py-5 sm:grid-cols-[3rem_1fr] sm:gap-5">
      <p className="text-sm font-semibold text-primary">{number}</p>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 leading-7 text-default-500">{description}</p>
      </div>
    </li>
  );
}

function FeatureLine({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <CheckIcon className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function ProgressPreview() {
  const activity = [34, 62, 42, 78, 56, 88, 68];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <section
      aria-label="Example Ordlys progress view"
      className="rounded-lg border border-default-200 bg-default-50 p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">Progress</p>
          <p className="mt-1 text-sm text-default-500">Across your active decks</p>
        </div>
        <p className="text-sm font-medium text-success">42% started</p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <ProgressStat label="Cards started" value="211" />
        <ProgressStat label="Strong or better" value="195" />
        <ProgressStat label="Recent accuracy" value="88%" />
        <ProgressStat label="Reviews due" value="12" />
      </dl>

      <div className="mt-5 border-t border-default-200 pt-4">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium">Cards practised</p>
          <p className="text-default-500">Last 7 days</p>
        </div>
        <div className="mt-4 flex h-24 items-end gap-2" aria-hidden="true">
          {activity.map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
              <span
                className="w-full rounded-t-sm bg-blue-600/80"
                style={{ height: `${height}%` }}
              />
              <span className="text-[10px] text-default-400">{days[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-default-200 bg-background p-3">
      <dt className="text-xs text-default-500">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold">{value}</dd>
    </div>
  );
}
