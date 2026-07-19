import { describe, expect, it } from 'vitest';
import {
  getPasswordGuidance,
  getSignUpErrorMessage,
  MIN_SIGNUP_PASSWORD_LENGTH,
} from './signup-guidance';

describe('getPasswordGuidance', () => {
  it('requires a password before signup', () => {
    expect(getPasswordGuidance('')).toEqual({
      isValid: false,
      strength: 'empty',
      strengthLabel: 'Not entered',
      strengthScore: 0,
    });
  });

  it('rejects passwords shorter than the published minimum', () => {
    const result = getPasswordGuidance('a'.repeat(MIN_SIGNUP_PASSWORD_LENGTH - 1));

    expect(result.isValid).toBe(false);
    expect(result.strength).toBe('weak');
  });

  it('accepts a simple password at the minimum length without overstating its strength', () => {
    expect(getPasswordGuidance('abcdefgh')).toMatchObject({
      isValid: true,
      strength: 'weak',
      strengthLabel: 'Weak',
      strengthScore: 1,
    });
  });

  it('recognizes longer and more varied passwords as strong', () => {
    expect(getPasswordGuidance('a-longer-passphrase-42')).toMatchObject({
      isValid: true,
      strength: 'strong',
      strengthLabel: 'Strong',
      strengthScore: 3,
    });
  });
});

describe('getSignUpErrorMessage', () => {
  it('maps an existing account to a useful next step', () => {
    expect(
      getSignUpErrorMessage({ code: 'user_already_exists', message: 'raw provider text' }),
    ).toBe('An account already exists for this email. Sign in or reset your password.');
  });

  it('maps email rate limits without exposing provider text', () => {
    expect(getSignUpErrorMessage({ code: 'over_email_send_rate_limit' })).toBe(
      'Too many attempts were made. Wait a little while, then try again.',
    );
  });

  it('uses a safe fallback for unknown failures', () => {
    expect(getSignUpErrorMessage(new Error('private provider detail'))).toBe(
      'Unable to create your account right now. Please try again.',
    );
  });

  it('supports a safe action-specific fallback', () => {
    expect(getSignUpErrorMessage({}, 'Unable to resend the email right now.')).toBe(
      'Unable to resend the email right now.',
    );
  });
});
