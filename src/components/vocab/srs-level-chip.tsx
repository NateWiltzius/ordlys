import { DEFAULT_SRS_CONFIG, SRS_LEVEL_LABELS } from '@/lib/srs/srs-config';
import { Chip } from '@heroui/react';

type Props = {
  srsLevel?: number;
};

export default function SrsLevelChip({ srsLevel }: Props) {
  if (srsLevel === undefined) {
    return (
      <Chip size="sm" variant="soft">
        Not started
      </Chip>
    );
  }

  const normalizedLevel = Math.min(
    DEFAULT_SRS_CONFIG.maxLevel,
    Math.max(DEFAULT_SRS_CONFIG.initialLevel, srsLevel),
  );

  return (
    <Chip
      size="sm"
      variant="soft"
      color={normalizedLevel >= 6 ? 'success' : normalizedLevel >= 3 ? 'warning' : 'default'}
    >
      Level {normalizedLevel} · {SRS_LEVEL_LABELS[normalizedLevel]}
    </Chip>
  );
}
