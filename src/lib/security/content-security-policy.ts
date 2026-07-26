type ContentSecurityPolicyInput = {
  nonce: string;
  supabaseUrl: string;
  isProduction: boolean;
};

export function buildContentSecurityPolicy({
  nonce,
  supabaseUrl,
  isProduction,
}: ContentSecurityPolicyInput): string {
  const supabaseOrigin = new URL(supabaseUrl).origin;
  const supabaseSocketOrigin = supabaseOrigin.replace(/^http/, 'ws');

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}'${isProduction ? '' : " 'unsafe-eval'"}`,
    `connect-src 'self' ${supabaseOrigin} ${supabaseSocketOrigin} https://*.vercel-insights.com`,
    isProduction ? 'upgrade-insecure-requests' : '',
  ]
    .filter(Boolean)
    .join('; ');
}
