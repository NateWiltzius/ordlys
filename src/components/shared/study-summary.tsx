import { ReviewCounts } from '@/types/review.types';
import { Card } from '@heroui/react';
import SummaryStat from '@/components/shared/summary-stat';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';

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
          <SummaryStat
            label="Ready to learn"
            value={counts.newWordsAvailable}
            className={STUDY_TONE_STYLES.learning.surface}
            valueClassName={STUDY_TONE_STYLES.learning.text}
          />
          <SummaryStat
            label="Reviews due"
            value={counts.reviewsDue}
            className={STUDY_TONE_STYLES.review.surface}
            valueClassName={STUDY_TONE_STYLES.review.text}
          />
        </div>
      </Card.Content>
    </Card>
  );
}
