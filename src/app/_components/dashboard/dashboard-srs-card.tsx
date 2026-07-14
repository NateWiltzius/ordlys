import { Card } from '@heroui/react';
import { SRS_CATEGORIES, type SrsCategoryCounts } from '@/lib/srs/srs-config';
import { SRS_CATEGORY_STYLES } from '@/lib/srs/srs-styles';

type Props = {
  counts: SrsCategoryCounts;
};

export default function DashboardSrsCard({ counts }: Props) {
  const total = SRS_CATEGORIES.reduce((sum, category) => sum + counts[category.key], 0);

  return (
    <Card>
      <Card.Header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="card__title">SRS distribution</h2>
          <Card.Description>Cards you have started across your active decks.</Card.Description>
        </div>
        <p className="text-sm text-default-500">
          {total} {total === 1 ? 'card' : 'cards'}
        </p>
      </Card.Header>

      <Card.Content className="space-y-4">
        {total > 0 ? (
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-default-100"
            aria-label={`SRS distribution across ${total} cards`}
          >
            {SRS_CATEGORIES.map(category => {
              const count = counts[category.key];
              if (count === 0) return null;

              return (
                <div
                  key={category.key}
                  className={SRS_CATEGORY_STYLES[category.key].bar}
                  style={{ width: `${(count / total) * 100}%` }}
                  title={`${category.label}: ${count}`}
                />
              );
            })}
          </div>
        ) : null}

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SRS_CATEGORIES.map(category => {
            const styles = SRS_CATEGORY_STYLES[category.key];
            return (
              <div key={category.key} className={`rounded-xl border p-3 ${styles.surface}`}>
                <dt className="flex items-center gap-2 text-sm font-medium">
                  <span className={`size-2.5 rounded-full ${styles.dot}`} aria-hidden="true" />
                  {category.label}
                </dt>
                <dd className={`mt-2 text-2xl font-semibold tabular-nums ${styles.text}`}>
                  {counts[category.key]}
                </dd>
                <dd className="mt-1 text-xs text-default-500">{category.levelLabel}</dd>
              </div>
            );
          })}
        </dl>
      </Card.Content>
    </Card>
  );
}
