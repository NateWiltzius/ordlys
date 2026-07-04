import { ReviewCounts } from '@/types/review.types';
import { Card } from '@heroui/react';

type Props = {
  counts: ReviewCounts;
  description: string;
};

export default function StudySummary({ counts, description }: Props) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Study summary</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total words" value={counts.totalWords} />
          <Stat label="New words available" value={counts.newWordsAvailable} />
          <Stat label="Reviews due" value={counts.reviewsDue} />
          <Stat label="Words in review" value={counts.wordsInReview} />
        </div>
      </Card.Content>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-default-100 px-3 py-2">
      <p className="text-sm text-default-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
