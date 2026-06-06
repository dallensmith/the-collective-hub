import { betterAuth } from 'better-auth';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import pg from 'pg';

const { Pool } = pg;

// ─── Environment Validation ─────────────────────────────────────────────────

const isDev = !building && process.env.NODE_ENV !== 'production';

function requireEnv(key: string, hint?: string): string {
	const value = (env as Record<string, string | undefined>)[key];
	if (!value) {
		if (isDev) {
			console.warn(
				`[auth] ${key} environment variable is not set. Using a dev fallback — DO NOT use in production.`
			);
			return `dev-fallback-${key.toLowerCase().replace(/_/g, '-')}`;
		}
		const hintMsg = hint ? ` ${hint}` : '';
		throw new Error(
			`${key} environment variable is required in production.${hintMsg}`
		);
	}
	return value;
}

// ─── Auth Pool ──────────────────────────────────────────────────────────────

/**
 * Dedicated pg Pool for Better Auth.
 * Better Auth natively supports pg.Pool — no Kysely wrapper needed.
 * Better Auth manages its own tables (user, session, account, verification).
 */
const authPool = new Pool({ connectionString: env.DATABASE_URL, max: 5 });

// ─── Better Auth Instance ───────────────────────────────────────────────────

export const auth = betterAuth({
	database: authPool,
	secret: requireEnv(
		'BETTER_AUTH_SECRET',
		'Generate one with: openssl rand -base64 32'
	),
	baseURL: env.BETTER_AUTH_URL || env.PUBLIC_SITE_URL || (isDev ? 'http://localhost:5173' : ''),
	socialProviders: {
		discord: {
			clientId: requireEnv(
				'DISCORD_CLIENT_ID',
				'Get it from https://discord.com/developers/applications'
			),
			clientSecret: requireEnv(
				'DISCORD_CLIENT_SECRET',
				'Get it from https://discord.com/developers/applications'
			)
		}
	}
});
