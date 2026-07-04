import { ReviewCounts } from '@/types/review.types';
import { Card } from '@heroui/react';
import SummaryStat from '@/components/shared/summary-stat';

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
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryStat label="Total words" value={counts.totalWords} />
          <SummaryStat label="Ready to learn" value={counts.newWordsAvailable} />
          <SummaryStat label="Reviews due" value={counts.reviewsDue} />
        </div>
      </Card.Content>
    </Card>
  );
}
