import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

export default defineConfig({
	schema: './lib/postgres/schema.ts',
	out: './lib/postgres/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.NEXT_PUBLIC_DATABASE_URL!,
	},
});
