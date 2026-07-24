import DeckBadge, { type DeckBadgeKind } from '@/components/shared/deck-badge';

type Props = {
  badges: DeckBadgeKind[];
  languagePair?: string | null;
  className?: string;
};

export default function DeckIdentity({ badges, languagePair, className = '' }: Props) {
  const uniqueBadges = [...new Set(badges)];

  if (uniqueBadges.length === 0 && !languagePair) return null;

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
    </div>
  );
}
