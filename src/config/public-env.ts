type PublicEnvironment = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

let cachedPublicEnvironment: PublicEnvironment | undefined;

function requiredValue(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${name} is not configured.`);
  return normalized;
}

function httpUrl(name: string, value: string | undefined): string {
  const normalized = requiredValue(name, value);

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
    return parsed.href.replace(/\/$/, '');
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) URL.`);
  }
}

export function getPublicEnvironment(): PublicEnvironment {
  cachedPublicEnvironment ??= {
    supabaseUrl: httpUrl('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabasePublishableKey: requiredValue(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };

  return cachedPublicEnvironment;
}
