import { ReviewCounts } from '@/types/review.types';
import { Card } from '@heroui/react';
import StatTile from '@/components/shared/stat-tile';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';

type Props = {
  counts: ReviewCounts;
  description: string;
};

export default function StudySummary({ counts, description }: Props) {
  return (
    <Card>
      <Card.Header>
        <h2 className="card__title">Study summary</h2>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Total words" value={counts.totalWords} />
          <StatTile
            label="Ready to learn"
            value={counts.newWordsAvailable}
            className={STUDY_TONE_STYLES.learning.surface}
            valueClassName={STUDY_TONE_STYLES.learning.text}
          />
          <StatTile
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
