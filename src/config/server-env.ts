import 'server-only';

let cachedSiteUrl: URL | undefined;

function optionalValue(value: string | undefined): string | null {
  return value?.trim() || null;
}

function requiredValue(name: string, value: string | undefined): string {
  const normalized = optionalValue(value);
  if (!normalized) throw new Error(`${name} is not configured.`);
  return normalized;
}

function parseSiteUrl(isProduction: boolean): URL {
  const configured =
    optionalValue(process.env.NEXT_PUBLIC_SITE_URL) ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null);

  if (!configured) {
    if (isProduction) throw new Error('NEXT_PUBLIC_SITE_URL is required in production.');
    return new URL('http://localhost:3000');
  }

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an absolute HTTP(S) URL.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an absolute HTTP(S) URL.');
  }
  return parsed;
}

export function getDatabaseUrl(): string {
  return requiredValue('DATABASE_URL', process.env.DATABASE_URL);
}

export function getSiteUrl(): URL {
  cachedSiteUrl ??= parseSiteUrl(isProduction());
  return cachedSiteUrl;
}

export function getSupabaseSecretKey(): string {
  return requiredValue(
    'SUPABASE_SECRET_KEY',
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getLegalContact() {
  return {
    operatorName: optionalValue(process.env.NEXT_PUBLIC_OPERATOR_NAME),
    contactEmail: optionalValue(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  };
}
