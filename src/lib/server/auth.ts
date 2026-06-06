import { betterAuth } from 'better-auth';
import { env } from '$env/dynamic/private';
import pg from 'pg';

const { Pool } = pg;

/**
 * Dedicated pg Pool for Better Auth.
 * Better Auth natively supports pg.Pool — no Kysely wrapper needed.
 * Better Auth manages its own tables (user, session, account, verification).
 */
const authPool = new Pool({ connectionString: env.DATABASE_URL, max: 5 });

export const auth = betterAuth({
	database: authPool,
	secret: env.BETTER_AUTH_SECRET || 'better-auth-dev-secret-change-in-production',
	baseURL: env.BETTER_AUTH_URL || env.PUBLIC_SITE_URL || 'http://localhost:5173',
	socialProviders: {
		discord: {
			clientId: env.DISCORD_CLIENT_ID || 'missing-client-id',
			clientSecret: env.DISCORD_CLIENT_SECRET || 'missing-client-secret'
		}
	}
});
