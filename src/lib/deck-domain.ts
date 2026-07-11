import { createHash } from 'node:crypto';

export type DeckStatus = 'active' | 'archived' | 'deleted' | 'moderation_removed';
export type CopyPolicy = 'follow_only' | 'private_forks' | 'public_forks';
export type DeckVisibility = 'private' | 'unlisted' | 'public';

export class DeckDomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DeckDomainError';
  }
}

const policyRank: Record<CopyPolicy, number> = {
  follow_only: 0,
  private_forks: 1,
  public_forks: 2,
};

export function assertActive(status: DeckStatus, operation: string) {
  if (status !== 'active')
    throw new DeckDomainError('DECK_INACTIVE', `Cannot ${operation} an inactive deck.`);
}

export function assertPolicyInheritance(source: CopyPolicy, requested: CopyPolicy) {
  if (policyRank[requested] > policyRank[source]) {
    throw new DeckDomainError(
      'COPY_POLICY_BROADENED',
      'A fork cannot broaden its source copy policy.',
    );
  }
}

export function canonicalReleaseHash(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
