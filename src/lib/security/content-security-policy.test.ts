import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy } from './content-security-policy';

describe('buildContentSecurityPolicy', () => {
  it('uses a nonce without allowing inline scripts in production', () => {
    const policy = buildContentSecurityPolicy({
      nonce: 'request-nonce',
      supabaseUrl: 'https://project.supabase.co',
      isProduction: true,
    });

    const scriptDirective = policy
      .split('; ')
      .find(directive => directive.startsWith('script-src'));
    expect(scriptDirective).toBe("script-src 'self' 'nonce-request-nonce'");
    expect(policy).toContain('wss://project.supabase.co');
    expect(policy).toContain('upgrade-insecure-requests');
  });

  it('allows source evaluation only for the development toolchain', () => {
    const policy = buildContentSecurityPolicy({
      nonce: 'development-nonce',
      supabaseUrl: 'http://localhost:54321',
      isProduction: false,
    });

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain('ws://localhost:54321');
    expect(policy).not.toContain('upgrade-insecure-requests');
  });
});
