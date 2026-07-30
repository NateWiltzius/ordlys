import DeckBadge, { type DeckBadgeKind } from '@/components/shared/deck-badge';
import { formatDeckStudyDirection, type DeckStudyDirection } from '@/lib/deck-study-direction';

type Props = {
  badges: DeckBadgeKind[];
  languagePair?: string | null;
  studyDirection?: DeckStudyDirection;
  className?: string;
};

export default function DeckIdentity({
  badges,
  languagePair,
  studyDirection,
  className = '',
}: Props) {
  const uniqueBadges = [...new Set(badges)];

  if (uniqueBadges.length === 0 && !languagePair && !studyDirection) return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}>
      {uniqueBadges.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          {uniqueBadges.map(kind => (
            <DeckBadge key={kind} kind={kind} />
          ))}
        </div>
      ) : null}
      {languagePair ? (
        <span className="text-sm font-medium text-default-600">{languagePair}</span>
      ) : null}
      {studyDirection ? (
        <span className="text-sm font-medium text-default-600">
          {formatDeckStudyDirection(studyDirection)}
        </span>
      ) : null}
    </div>
  );
}
