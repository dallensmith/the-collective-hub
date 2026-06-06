import { db } from './index';
import { sites, siteSettings } from './schema';

/**
 * Creates a test site record and associated settings row.
 * Only intended for local development / seeding.
 */
async function seed() {
	console.log('🌱 Seeding database...');

	// Create a test site
	const [site] = await db
		.insert(sites)
		.values({
			slug: 'local-dev',
			name: 'Local Dev Site',
			isActive: true
		})
		.onConflictDoNothing()
		.returning();

	if (site) {
		console.log(`  ✅ Created site: ${site.name} (${site.slug})`);

		// Create default site settings
		await db
			.insert(siteSettings)
			.values({
				siteId: site.id,
				settings: {
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
				}
			})
			.onConflictDoNothing();

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
