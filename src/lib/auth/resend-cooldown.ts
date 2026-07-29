export const RESEND_CONFIRMATION_COOLDOWN_MS = 60_000;

export function getResendCooldownSeconds(availableAt: number, now: number): number {
  return Math.max(0, Math.ceil((availableAt - now) / 1_000));
}
