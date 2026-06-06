---
description: 'Scaffold seed data script for The Collective Hub. Generates a seed.mjs file that creates a local dev site, default settings, and optional sample data.'
agent: 'agent'
---

Generate or update a seed script for The Collective Hub.

Follow the conventions in:
- [database-schema.instructions.md](.github/instructions/database-schema.instructions.md)
- [multi-tenant-architecture.instructions.md](.github/instructions/multi-tenant-architecture.instructions.md)

## Purpose

The seed script creates a local development site so that the app runs without requiring an existing site in the database.

## Script Structure ([`scripts/seed.mjs`](scripts/seed.mjs))

```js
// @ts-check
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/collective_hub';
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
    console.log('🌱 Seeding database...');

    // Upsert site
    const [site] = await db
        .insert(schema.sites)
        .values({
            slug: 'local-dev',
            name: 'Local Dev Site',
            isActive: true,
        })
        .onConflictDoUpdate({ target: schema.sites.slug, set: { name: 'Local Dev Site' } })
        .returning();

    // Upsert site settings
    const defaultSettings = {
        branding: {
            siteName: 'Local Dev Site',
            tagline: 'A community for watching bad movies',
            logoCdnKey: null,
            backgroundCdnKey: null,
            faviconCdnKey: null,
        },
        theme: {
            preset: 'dark',
            accentColor: '#e63946',
            backgroundColor: '#1a1a2e',
            textColor: '#eaeaea',
        },
        homepage: {
            heroTitle: 'Welcome to Local Dev Site',
            heroSubtitle: 'We watch bad movies so you don\'t have to',
            aboutText: 'A community of bad movie enthusiasts who gather weekly to watch, laugh, and critique the worst cinema has to offer.',
            primaryButtonText: 'Join us on Discord',
            primaryButtonLink: 'https://discord.gg/example',
            showNextEvent: true,
            showSchedule: true,
        },
        layout: {
            preset: 'standard',
        },
    };

    await db
        .insert(schema.siteSettings)
        .values({ siteId: site.id, settings: defaultSettings })
        .onConflictDoUpdate({ target: schema.siteSettings.siteId, set: { settings: defaultSettings } });

    console.log(`✅ Seeded site: ${site.slug} (${site.id})`);
    await client.end();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
```

## Environment

- Set `DATABASE_URL` env var for the target database
- Defaults to `postgresql://localhost:5432/collective_hub` for local dev
- Run with: `node scripts/seed.mjs`
