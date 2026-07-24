export type DeckCardRelationship = 'owned' | 'copy' | 'following' | 'discover' | 'restorable';
export type DeckCardContext = 'learning' | 'created' | 'discover';

export type DeckCardAction =
  | 'copy'
  | 'delete'
  | 'follow'
  | 'manage'
  | 'review'
  | 'restore'
  | 'unfollow';

type DeckRowPrimaryAction = DeckCardAction | 'learn' | 'open';

type DeckCardActionInput = {
  context: DeckCardContext;
  relationship: DeckCardRelationship;
  isFollowing: boolean;
  hasPublishedRelease: boolean;
  allowsCopying: boolean;
};

type DeckCardActionPlan = {
  primary: DeckCardAction;
  menu: DeckCardAction[];
};

export function getDeckCardActionPlan({
  context,
  relationship,
  isFollowing,
  hasPublishedRelease,
  allowsCopying,
}: DeckCardActionInput): DeckCardActionPlan {
  if (relationship === 'restorable') {
    return { primary: 'restore', menu: [] };
  }

  const isOwned = relationship === 'owned' || relationship === 'copy';
  const primary =
    context === 'created' ? 'manage' : isFollowing ? 'review' : isOwned ? 'manage' : 'follow';
  const menu: DeckCardAction[] = [];

  if (isFollowing && primary !== 'review') menu.push('review');
  if (isOwned && primary !== 'manage') menu.push('manage');
  if (isOwned && !isFollowing && hasPublishedRelease) menu.push('follow');
  if (
    (relationship === 'discover' || relationship === 'following') &&
    hasPublishedRelease &&
    allowsCopying
  ) {
    menu.push('copy');
  }
  if (isFollowing) menu.push('unfollow');
  if (isOwned) menu.push('delete');

  return { primary, menu };
}

export function getDeckRowPrimaryAction(
  primary: DeckCardAction,
  context: DeckCardContext,
  stats: { reviewsDue: number; newWordsAvailable: number },
): DeckRowPrimaryAction {
  if (context === 'discover' && primary === 'review') return 'open';
  if (context !== 'learning' || primary !== 'review') return primary;
  if (stats.reviewsDue > 0) return 'review';
  if (stats.newWordsAvailable > 0) return 'learn';
  return 'open';
}
