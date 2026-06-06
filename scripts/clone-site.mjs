// Standalone site-cloning script — reads DATABASE_URL from .env via process.env.
// Works without SvelteKit/Vite module resolution.
//
// Usage:
//   node scripts/clone-site.mjs --source-slug <slug> --target-name "<Name>" --target-slug <slug>
//
// Example:
//   node scripts/clone-site.mjs --source-slug local-dev --target-name "My New Site" --target-slug my-new-site

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Parse .env ───────────────────────────────────────────────────────────────

const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith('#')) continue;
	const [key, ...rest] = trimmed.split('=');
	if (key) env[key.trim()] = rest.join('=').trim();
}

if (!env.DATABASE_URL) {
	console.error('❌ DATABASE_URL not found in .env. Aborting.');
	process.exit(1);
}

const sql = postgres(env.DATABASE_URL);

// ─── Parse CLI Args ───────────────────────────────────────────────────────────

function parseArgs() {
	const args = {};
	const raw = process.argv.slice(2);
	for (let i = 0; i < raw.length; i++) {
		const arg = raw[i];
		if (arg.startsWith('--')) {
			const key = arg.slice(2);
			const val = raw[i + 1];
			if (val && !val.startsWith('--')) {
				args[key] = val;
				i++;
			} else {
				args[key] = true;
			}
		}
	}
	return args;
}

const args = parseArgs();

const sourceSlug = args['source-slug'];
const targetName = args['target-name'];
const targetSlug = args['target-slug'];

// ─── Validate ─────────────────────────────────────────────────────────────────

if (!sourceSlug) {
	console.error('❌ --source-slug is required.');
	process.exit(1);
}
if (!targetName) {
	console.error('❌ --target-name is required.');
	process.exit(1);
}
if (!targetSlug) {
	console.error('❌ --target-slug is required.');
	process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(targetSlug)) {
	console.error('❌ --target-slug must contain only lowercase letters, numbers, and hyphens.');
	process.exit(1);
}

// ─── Clone ────────────────────────────────────────────────────────────────────

async function clone() {
	console.log('🔄 Cloning site...');
	console.log(`   Source slug : ${sourceSlug}`);
	console.log(`   Target name : ${targetName}`);
	console.log(`   Target slug : ${targetSlug}`);

	// 1. Find source site
	const [sourceSite] = await sql`
		SELECT id, name, slug FROM sites WHERE slug = ${sourceSlug} LIMIT 1
	`;

	if (!sourceSite) {
		console.error(`❌ Source site with slug "${sourceSlug}" not found.`);
		process.exit(1);
	}

	console.log(`   ✅ Found source site: ${sourceSite.name} (${sourceSite.id})`);

	// 2. Check target slug uniqueness
	const [existing] = await sql`
		SELECT id FROM sites WHERE slug = ${targetSlug} LIMIT 1
	`;

	if (existing) {
		console.error(`❌ A site with slug "${targetSlug}" already exists. Choose a different --target-slug.`);
		process.exit(1);
	}

	// 3. Read source site's published settings
	const [sourceSettings] = await sql`
		SELECT settings FROM site_settings WHERE site_id = ${sourceSite.id} LIMIT 1
	`;

	const clonedSettings = sourceSettings?.settings ?? {};

	// Update branding.siteName to the new site name
	if (clonedSettings.branding && typeof clonedSettings.branding === 'object') {
		clonedSettings.branding.siteName = targetName;
	} else {
		clonedSettings.branding = { siteName: targetName };
	}

	console.log(`   📋 Cloned settings (branding.siteName updated to "${targetName}")`);

	// 4. Insert new site
	const newSiteId = crypto.randomUUID();
	const now = new Date();

	await sql`
		INSERT INTO sites (id, slug, name, is_active, created_at, updated_at)
		VALUES (${newSiteId}, ${targetSlug}, ${targetName}, true, ${now}, ${now})
	`;
	console.log(`   ✅ Created site: ${targetName} (${newSiteId})`);

	// 5. Insert site settings
	await sql`
		INSERT INTO site_settings (site_id, settings, created_at, updated_at)
		VALUES (${newSiteId}, ${sql.json(clonedSettings)}, ${now}, ${now})
	`;
	console.log('   ✅ Copied site settings');

	// 6. Optionally copy nav links (with new UUIDs)
	const sourceNavLinks = await sql`
		SELECT label, url, position, sort_order, is_external
		FROM nav_links WHERE site_id = ${sourceSite.id}
		ORDER BY position, sort_order
	`;

	if (sourceNavLinks.length > 0) {
		for (const link of sourceNavLinks) {
			await sql`
				INSERT INTO nav_links (id, site_id, label, url, position, sort_order, is_external, created_at, updated_at)
				VALUES (${crypto.randomUUID()}, ${newSiteId}, ${link.label}, ${link.url}, ${link.position}, ${link.sort_order}, ${link.is_external}, ${now}, ${now})
			`;
		}
		console.log(`   ✅ Copied ${sourceNavLinks.length} nav link(s)`);
	} else {
		console.log('   ℹ️  No nav links to copy.');
	}

	// 7. Optionally copy social links (with new UUIDs)
	const sourceSocialLinks = await sql`
		SELECT platform, label, url, icon, sort_order
		FROM social_links WHERE site_id = ${sourceSite.id}
		ORDER BY sort_order
	`;

	if (sourceSocialLinks.length > 0) {
		for (const link of sourceSocialLinks) {
			await sql`
				INSERT INTO social_links (id, site_id, platform, label, url, icon, sort_order, created_at, updated_at)
				VALUES (${crypto.randomUUID()}, ${newSiteId}, ${link.platform}, ${link.label}, ${link.url}, ${link.icon}, ${link.sort_order}, ${now}, ${now})
			`;
		}
		console.log(`   ✅ Copied ${sourceSocialLinks.length} social link(s)`);
	} else {
		console.log('   ℹ️  No social links to copy.');
	}

	// ─── Summary ───────────────────────────────────────────────────────────────

	console.log('');
	console.log('🎉 Clone complete!');
	console.log('');
	console.log('Summary:');
	console.log(`   Site ID      : ${newSiteId}`);
	console.log(`   Name         : ${targetName}`);
	console.log(`   Slug         : ${targetSlug}`);
	console.log(`   Settings     : Copied from "${sourceSlug}" (branding.siteName updated)`);
	console.log(`   Nav links    : ${sourceNavLinks.length} copied`);
	console.log(`   Social links : ${sourceSocialLinks.length} copied`);
	console.log('');
	console.log('📝 Next steps:');
	console.log(`   - Set SITE_SLUG=${targetSlug} in the Coolify deployment`);
	console.log(`   - Set PUBLIC_SITE_URL for the new deployment`);
	console.log(`   - Set OWNER_DISCORD_ID for the site owner`);
	console.log(`   - Ensure RUN_MIGRATIONS=false on this deployment`);
}

clone()
	.catch((err) => {
		console.error('❌ Clone failed:', err);
		process.exit(1);
	})
	.finally(() => {
		sql.end();
		process.exit(0);
	});
