export type DashboardAction = 'review' | 'learn' | 'practice';

type DashboardActionCounts = {
  reviewsDue: number;
  newWordsAvailable: number;
  recentMistakes: number;
};

const actionPriority: Array<{ action: DashboardAction; count: keyof DashboardActionCounts }> = [
  { action: 'review', count: 'reviewsDue' },
  { action: 'learn', count: 'newWordsAvailable' },
  { action: 'practice', count: 'recentMistakes' },
];

export function getDashboardActionOrder(counts: DashboardActionCounts): DashboardAction[] {
  return [...actionPriority]
    .sort((first, second) => {
      const availabilityDifference =
        Number(counts[second.count] > 0) - Number(counts[first.count] > 0);

      if (availabilityDifference !== 0) return availabilityDifference;
      return actionPriority.indexOf(first) - actionPriority.indexOf(second);
    })
    .map(item => item.action);
}

export function getDashboardReviewAction(reviewsDue: number, deckIds: number[]) {
  if (reviewsDue <= 0) return { href: undefined, shouldChooseDeck: false };
  if (deckIds.length === 1) {
    return { href: `/decks/${deckIds[0]}/review`, shouldChooseDeck: false };
  }
  if (deckIds.length > 1) return { href: undefined, shouldChooseDeck: true };
  return { href: '/review', shouldChooseDeck: false };
}
