import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { toast } from 'sonner';

neonConfig.fetchConnectionCache = true;
if (!process.env.NEXT_PUBLIC_DATABASE_URL) {
	toast.error('Database URL is not set');
	throw new Error('Set NEXT_PUBLIC_DATABASE_URL in .env before running');
}

const url = neon(process.env.NEXT_PUBLIC_DATABASE_URL);

export const db = drizzle(url);
