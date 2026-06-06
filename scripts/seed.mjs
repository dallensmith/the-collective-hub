// Minimal seed script — reads DATABASE_URL from .env via process.env
// Works standalone without SvelteKit/Vite module resolution.

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env manually
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith('#')) continue;
	const [key, ...rest] = trimmed.split('=');
	if (key) env[key.trim()] = rest.join('=').trim();
}

const sql = postgres(env.DATABASE_URL);

async function seed() {
	console.log('🌱 Seeding database...');

	const [site] = await sql`
		INSERT INTO sites (slug, name, is_active)
		VALUES ('local-dev', 'Local Dev Site', true)
		ON CONFLICT (slug) DO NOTHING
		RETURNING id
	`;

	if (site) {
		console.log(`  ✅ Created site: Local Dev Site (local-dev)`);

		await sql`
			INSERT INTO site_settings (site_id, settings)
			VALUES (${site.id}, ${sql.json({
				branding: {
					siteName: 'Local Dev Site',
					tagline: 'A local development site',
					logoCdnKey: null,
					backgroundCdnKey: null,
					faviconCdnKey: null
				},
				theme: {
					preset: 'dark',
					accentColor: '#e63946',
					backgroundColor: '#1a1a2e',
					textColor: '#eaeaea'
				},
				homepage: {
					heroTitle: 'Welcome',
					heroSubtitle: 'This is a development site',
					aboutText: '',
					primaryButtonText: 'Join us on Discord',
					primaryButtonLink: 'https://discord.gg/example',
					showNextEvent: true,
					showSchedule: true
				},
				layout: {
					preset: 'standard'
				}
			})})
			ON CONFLICT (site_id) DO NOTHING
		`;

		console.log('  ✅ Created default site settings');
	} else {
		console.log('  ℹ️  Site "local-dev" already exists, skipping.');
	}

	console.log('🎉 Seeding complete!');
}

seed()
	.catch((err) => {
		console.error('❌ Seed failed:', err);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
