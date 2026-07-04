import { Button, Card, Chip } from '@heroui/react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center px-4 py-10">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Chip size="sm" variant="soft" color="success">
            Smart flashcards for language learning
          </Chip>

          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Learn words today. Review them before you forget.
            </h1>
            <p className="max-w-2xl text-lg text-default-500">
              Ordlys helps you build vocabulary decks, study new words, and review them at the right
              time so they actually stick.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/auth/sign-up">
              <Button variant="primary" size="lg">
                Start learning
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" size="lg">
                Log in
              </Button>
            </Link>
          </div>
        </div>

        <Card variant="secondary" className="w-full">
          <Card.Header>
            <Card.Title>Today&apos;s study plan</Card.Title>
            <Card.Description>A simple queue for learning and review.</Card.Description>
          </Card.Header>

          <Card.Content className="space-y-3">
            <div className="rounded-lg bg-default-100 px-4 py-3">
              <p className="text-sm text-default-500">New words available</p>
              <p className="text-2xl font-semibold">12</p>
            </div>

            <div className="rounded-lg bg-default-100 px-4 py-3">
              <p className="text-sm text-default-500">Reviews due</p>
              <p className="text-2xl font-semibold">28</p>
            </div>

            <div className="rounded-lg bg-default-100 px-4 py-3">
              <p className="text-sm text-default-500">Active deck</p>
              <p className="font-medium">Norwegian A1 Vocabulary</p>
            </div>
          </Card.Content>
        </Card>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="Create decks"
          description="Organize vocabulary by topic, lesson, exam, textbook, or whatever you are learning."
        />
        <FeatureCard
          title="Study both directions"
          description="Practice recognizing words and producing answers so your knowledge is actually usable."
        />
        <FeatureCard
          title="Review on schedule"
          description="Ordlys keeps track of what is due so you can focus on the next useful session."
        />
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
    </Card>
  );
}
