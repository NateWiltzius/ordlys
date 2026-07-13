import { DECK_LIMITS } from '../config/deck-limits';
import { DeckDomainError } from './deck-domain';

export type AuthoringUsage = {
  activeDecks: number;
  publicDecks: number;
  deckCards: number;
  logicalVocabs: number;
  revisionsToday: number;
};

export type AuthoringCapacityRequest = Partial<Record<keyof AuthoringUsage, number>>;

type QuotaOverrides = Partial<Record<keyof AuthoringUsage, { code?: string; message?: string }>>;

const quotaRules: Record<keyof AuthoringUsage, { limit: number; code: string; message: string }> = {
  activeDecks: {
    limit: DECK_LIMITS.activeOwnedDecks,
    code: 'DECK_QUOTA',
    message: 'Active deck limit reached.',
  },
  publicDecks: {
    limit: DECK_LIMITS.publicCatalogDecks,
    code: 'PUBLIC_DECK_QUOTA',
    message: 'Public catalog deck limit reached.',
  },
  deckCards: {
    limit: DECK_LIMITS.cardsPerDeck,
    code: 'CARD_QUOTA',
    message: 'This deck has reached its card limit.',
  },
  logicalVocabs: {
    limit: DECK_LIMITS.logicalVocabsPerAccount,
    code: 'VOCAB_QUOTA',
    message: 'Account vocabulary limit reached.',
  },
  revisionsToday: {
    limit: DECK_LIMITS.revisionsPerDay,
    code: 'REVISION_RATE_LIMIT',
    message: 'Daily revision limit reached.',
  },
};

export function assertAuthoringCapacity(
  usage: AuthoringUsage,
  request: AuthoringCapacityRequest,
  overrides: QuotaOverrides = {},
): void {
  for (const key of Object.keys(request) as Array<keyof AuthoringUsage>) {
    const addition = request[key] ?? 0;
    if (addition < 0 || !Number.isInteger(addition)) {
      throw new Error(`Invalid authoring capacity request for ${key}.`);
    }

    const rule = quotaRules[key];
    if (usage[key] + addition > rule.limit) {
      throw new DeckDomainError(
        overrides[key]?.code ?? rule.code,
        overrides[key]?.message ?? rule.message,
      );
    }
  }
}
