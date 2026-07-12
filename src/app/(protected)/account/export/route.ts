import { getAccountExportData } from '@/db/queries/account.queries';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;
  if (error || typeof userId !== 'string') {
    return new Response('Authentication required.', { status: 401 });
  }

  const account = await getAccountExportData(userId);
  const exported = {
    account: {
      id: userId,
      email: typeof claims?.email === 'string' ? claims.email : null,
    },
    ...account,
  };

  return new Response(JSON.stringify(exported, null, 2), {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'attachment; filename="ordlys-account-data.json"',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
