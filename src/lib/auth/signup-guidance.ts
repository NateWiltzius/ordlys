export const MIN_SIGNUP_PASSWORD_LENGTH = 8;

type PasswordStrength = 'empty' | 'weak' | 'fair' | 'strong';

type PasswordGuidance = {
  isValid: boolean;
  strength: PasswordStrength;
  strengthLabel: string;
  strengthScore: number;
};

export function getPasswordGuidance(password: string): PasswordGuidance {
  if (!password) {
    return {
      isValid: false,
      strength: 'empty',
      strengthLabel: 'Not entered',
      strengthScore: 0,
    };
  }

  const isValid = password.length >= MIN_SIGNUP_PASSWORD_LENGTH;
  const hasVariety = /[a-zA-Z]/.test(password) && /[^a-zA-Z]/.test(password);
  const strengthScore =
    Number(isValid) + Number(password.length >= 12) + Number(isValid && hasVariety);

  if (strengthScore >= 3) {
    return { isValid, strength: 'strong', strengthLabel: 'Strong', strengthScore };
  }

  if (strengthScore >= 2) {
    return { isValid, strength: 'fair', strengthLabel: 'Good', strengthScore };
  }

  return {
    isValid,
    strength: 'weak',
    strengthLabel: isValid ? 'Weak' : 'Too short',
    strengthScore,
  };
}

export function getSignUpErrorMessage(
  error: unknown,
  fallback = 'Unable to create your account right now. Please try again.',
): string {
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : null;

  switch (code) {
    case 'email_exists':
    case 'identity_already_exists':
    case 'user_already_exists':
      return 'An account already exists for this email. Sign in or reset your password.';
    case 'email_address_invalid':
      return 'Enter a valid email address.';
    case 'weak_password':
      return 'Choose a stronger password and try again.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts were made. Wait a little while, then try again.';
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'Account creation is temporarily unavailable.';
    case 'captcha_failed':
      return 'The security check could not be completed. Refresh the page and try again.';
    case 'request_timeout':
      return 'The request took too long. Check your connection and try again.';
    case 'validation_failed':
      return 'Check your email and password, then try again.';
    default:
      return fallback;
  }
}
