import { describe, expect, it } from 'vitest';
import {
  buildEmailConfirmationRedirect,
  getEmailConfirmationDestination,
  getEmailConfirmationType,
} from './email-confirmation';

describe('email confirmation redirects', () => {
  it('builds a callback URL that preserves the intended internal destination', () => {
    expect(buildEmailConfirmationRedirect('https://www.ordlys.com', '/decks?create=1')).toBe(
      'https://www.ordlys.com/auth/confirm?next=%2Fdecks%3Fcreate%3D1',
    );
  });

  it('falls back to the dashboard instead of accepting an external destination', () => {
    expect(
      buildEmailConfirmationRedirect('https://www.ordlys.com', 'https://attacker.example'),
    ).toBe('https://www.ordlys.com/auth/confirm?next=%2Fdashboard');

    expect(
      getEmailConfirmationDestination(
        'https://www.ordlys.com',
        '//attacker.example/steal-session',
      ).toString(),
    ).toBe('https://www.ordlys.com/dashboard');
  });

  it.each(['email', 'signup'] as const)('accepts the %s confirmation token type', type => {
    expect(getEmailConfirmationType(type)).toBe(type);
  });

  it.each([null, 'recovery', 'invite', 'not-a-real-type'])(
    'rejects a non-confirmation token type: %s',
    type => {
      expect(getEmailConfirmationType(type)).toBeNull();
    },
  );
});
