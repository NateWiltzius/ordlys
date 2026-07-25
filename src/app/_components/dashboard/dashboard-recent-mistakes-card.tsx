import StudyActionCard from '@/app/(protected)/decks/[deckId]/_components/study-action-card';
import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';

type Props = {
  count: number;
};

export default function DashboardRecentMistakesCard({ count }: Props) {
  return (
    <StudyActionCard
      title="Extra practice"
      description="Revisit recently missed cards without changing their review schedule."
      count={count}
      countLabel={`recent ${count === 1 ? 'card' : 'cards'} to revisit`}
      actionLabel="Start practice"
      icon={ArrowPathRoundedSquareIcon}
      tone="practice"
      href={count > 0 ? '/practice/recent-mistakes' : undefined}
      isDisabled={count === 0}
      unavailableAction={
        <Button variant="secondary" size="lg" className="w-full" isDisabled>
          No extra practice
        </Button>
      }
    />
  );
}
