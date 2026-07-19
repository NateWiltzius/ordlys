import {
  getSrsCategoryKey,
  getSrsLevelDisplayLabel,
  normalizeSrsLevel,
} from '@/lib/srs/srs-config';
import { SRS_CATEGORY_STYLES } from '@/lib/srs/srs-styles';
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

  const normalizedLevel = normalizeSrsLevel(srsLevel);
  const categoryKey = getSrsCategoryKey(normalizedLevel);

  return (
    <Chip size="sm" variant="soft" className={SRS_CATEGORY_STYLES[categoryKey].chip}>
      {getSrsLevelDisplayLabel(normalizedLevel)}
    </Chip>
  );
}
