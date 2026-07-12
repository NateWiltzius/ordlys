import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { Chip } from '@heroui/react';

export type DeckBadgeKind =
  | 'archived'
  | 'deletion-pending'
  | 'following'
  | 'copy'
  | 'owned'
  | 'private'
  | 'public'
  | 'source-archived'
  | 'source-deletion-pending'
  | 'unlisted';

type Props = {
  kind: DeckBadgeKind;
  className?: string;
};

export default function DeckBadge({ kind, className }: Props) {
  if (kind === 'following') {
    return (
      <Chip size="sm" className={`${STUDY_TONE_STYLES.learning.accent} ${className ?? ''}`}>
        Following
      </Chip>
    );
  }

  if (kind === 'owned' || kind === 'copy') {
    return (
      <Chip size="sm" variant="secondary" className={className}>
        {kind === 'owned' ? 'Owned' : 'Copy'}
      </Chip>
    );
  }

  if (kind === 'public') {
    return (
      <Chip size="sm" variant="soft" color="success" className={className}>
        Public
      </Chip>
    );
  }

  if (kind === 'private') {
    return (
      <Chip size="sm" variant="soft" color="default" className={className}>
        Private
      </Chip>
    );
  }

  if (kind === 'unlisted') {
    return (
      <Chip size="sm" variant="soft" color="warning" className={className}>
        Unlisted
      </Chip>
    );
  }

  const label = {
    archived: 'Archived',
    'deletion-pending': 'Deletion pending',
    'source-archived': 'Source archived',
    'source-deletion-pending': 'Source deletion pending',
  }[kind];

  return (
    <Chip size="sm" variant="soft" color="warning" className={className}>
      {label}
    </Chip>
  );
}
