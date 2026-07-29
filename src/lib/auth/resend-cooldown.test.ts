import { describe, expect, it } from 'vitest';
import { getResendCooldownSeconds, RESEND_CONFIRMATION_COOLDOWN_MS } from './resend-cooldown';

describe('confirmation email resend cooldown', () => {
  it('starts at the configured 60-second interval', () => {
    const now = 10_000;

    expect(getResendCooldownSeconds(now + RESEND_CONFIRMATION_COOLDOWN_MS, now)).toBe(60);
  });

  it('rounds partial seconds up so the button is not enabled early', () => {
    expect(getResendCooldownSeconds(60_000, 1)).toBe(60);
    expect(getResendCooldownSeconds(60_000, 1_001)).toBe(59);
  });

  it('stops at zero after the deadline', () => {
    expect(getResendCooldownSeconds(60_000, 60_000)).toBe(0);
    expect(getResendCooldownSeconds(60_000, 61_000)).toBe(0);
  });
});
