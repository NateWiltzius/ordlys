import { AUTHENTICATED_USER_ID_HEADER } from '@/lib/auth/auth-headers';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateSession } from './proxy';

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
}));

vi.mock('@/config/supabase', () => ({
  getSupabasePublicConfig: () => ({
    url: 'https://project.supabase.co',
    publishableKey: 'publishable-key',
  }),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getClaims: mocks.getClaims,
    },
  }),
}));

describe('updateSession', () => {
  beforeEach(() => {
    mocks.getClaims.mockReset();
    mocks.getClaims.mockResolvedValue({ data: null, error: null });
  });

  it('redirects an anonymous protected request to sign in', async () => {
    const request = new NextRequest('http://localhost/dashboard?from=audit');

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost/auth/sign-in?next=%2Fdashboard%3Ffrom%3Daudit',
    );
  });

  it('does not accept or forward a client-supplied identity header', async () => {
    const request = new NextRequest('http://localhost/dashboard', {
      headers: {
        [AUTHENTICATED_USER_ID_HEADER]: '00000000-0000-0000-0000-000000000000',
      },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get(`x-middleware-request-${AUTHENTICATED_USER_ID_HEADER}`)).toBeNull();
    expect(response.headers.get('x-middleware-override-headers') ?? '').not.toContain(
      AUTHENTICATED_USER_ID_HEADER,
    );
  });
});
