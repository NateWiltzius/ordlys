import { drizzle } from 'drizzle-orm/postgres-js';
// import * as schema from '@/db/schema';
import postgres from 'postgres';
import { getDatabaseUrl } from '@/config/server-env';

const client = postgres(getDatabaseUrl(), {
  prepare: false,
  ssl: 'require',
});
// export const db = drizzle(client, { schema });
export const db = drizzle(client);
