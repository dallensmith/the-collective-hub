---
description: 'Use when creating or modifying database tables, writing Drizzle queries, adding migrations, or understanding the schema. Covers all tables, relationships, indexes, migration strategy, and Drizzle ORM patterns for The Collective Hub.'
applyTo: 'src/lib/server/db/**/*.ts', 'drizzle/**/*.sql'
---

# Database Schema

## Design Principles

- **`siteId` on every site-owned table** — non-negotiable
- **Prefer normalized tables over JSON columns** — except for theme/branding settings where flexibility is valuable
- **Timestamps on every table** (`createdAt`, `updatedAt`)
- **Use UUIDs for primary keys** — avoids sequential ID enumeration and works well distributed
- **Index `siteId` on every table that has it** — it's the most common query filter
- **Soft deletes where appropriate** — prefer `deletedAt` over hard deletes

## Entity Relationship

```mermaid
erDiagram
    sites ||--o{ memberships : "has"
    sites ||--|| siteSettings : "has"
    sites ||--o{ assets : "owns"
    sites ||--o{ navLinks : "has"
    sites ||--o{ socialLinks : "has"
    sites ||--o{ events : "hosts"
    users ||--o{ memberships : "has"
    users ||--o{ assets : "uploads"

    sites {
        uuid id PK
        text slug UK
        text name
        boolean isActive
    }

    users {
        uuid id PK
        text discordId UK
        text discordUsername
        text discordAvatar
    }

    memberships {
        uuid id PK
        uuid siteId FK
        uuid userId FK
        enum role
    }

    siteSettings {
        uuid id PK
        uuid siteId FK UK
        jsonb settings
    }

    events {
        uuid id PK
        uuid siteId FK
        text title
        timestamptz startTime
        boolean isPublished
    }
```

## Table Reference

### `sites`

The core tenant table. One row per deployed site.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | `defaultRandom()` |
| `slug` | `text` (UNIQUE, NOT NULL) | Matches `SITE_SLUG` env var |
| `name` | `text` (NOT NULL) | Display name |
| `isActive` | `boolean` (default true) | Soft disable a site |
| `createdAt` | `timestamptz` | `defaultNow()` |
| `updatedAt` | `timestamptz` | `defaultNow()` + `$onUpdate()` |

**Indexes:** UNIQUE on `slug`.

### `users`

Auth users. Created automatically on first Discord login.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | `defaultRandom()` |
| `discordId` | `text` (UNIQUE, NOT NULL) | Discord user ID |
| `discordUsername` | `text` | Display name from Discord |
| `discordAvatar` | `text` | Avatar hash/URL from Discord |
| `email` | `text` | If available from Discord scope |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |
| `lastLoginAt` | `timestamptz` | |

**Indexes:** UNIQUE on `discordId`.

> Note: Better Auth manages its own session/account tables. The `users` table here is the application-level user profile.

### `memberships`

Links users to sites with a role. A user can be a member of multiple sites with different roles.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `siteId` | `uuid` → `sites.id` (NOT NULL) | |
| `userId` | `uuid` → `users.id` (NOT NULL) | |
| `role` | `enum('owner', 'admin', 'editor')` | See role definitions |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** UNIQUE on `(siteId, userId)`. INDEX on `siteId`. INDEX on `userId`.

### `siteSettings`

Single JSON column per site for all configuration.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `siteId` | `uuid` → `sites.id` (UNIQUE, NOT NULL) | One settings row per site |
| `settings` | `jsonb` (NOT NULL, default `{}`) | All site settings as JSON |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** UNIQUE on `siteId`.

The `settings` JSON structure (typed in [`src/lib/shared/types.ts`](src/lib/shared/types.ts)):

```typescript
interface SiteSettingsData {
    branding: {
        siteName: string;
        tagline: string;
        logoCdnKey: string | null;
        backgroundCdnKey: string | null;
        faviconCdnKey: string | null;
    };
    theme: {
        preset: 'dark' | 'light' | 'custom';
        accentColor: string;
        backgroundColor: string;
        textColor: string;
    };
    homepage: {
        heroTitle: string;
        heroSubtitle: string;
        aboutText: string;
        primaryButtonText: string;
        primaryButtonLink: string;
        showNextEvent: boolean;
        showSchedule: boolean;
    };
    layout: {
        preset: 'standard';
    };
}
```

**Why JSON for settings?** Settings are read as a batch, rarely queried individually, and benefit from schema flexibility. Adding a new setting requires no migration.

### `assets`

Records of uploaded media files stored in the CDN.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `siteId` | `uuid` → `sites.id` (NOT NULL) | |
| `uploadedByUserId` | `uuid` → `users.id` | Nullable for system assets |
| `type` | `text` (NOT NULL) | e.g., `image`, `document` |
| `filename` | `text` (NOT NULL) | Original filename |
| `mimeType` | `text` | e.g., `image/webp` |
| `size` | `integer` | Bytes |
| `cdnKey` | `text` (NOT NULL) | Path within CDN bucket |
| `altText` | `text` | Accessibility description |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** INDEX on `siteId`. INDEX on `cdnKey`.

### `navLinks`

Custom navigation links for a site's header/footer.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `siteId` | `uuid` → `sites.id` (NOT NULL) | |
| `label` | `text` (NOT NULL) | Display text |
| `url` | `text` (NOT NULL) | Link target |
| `position` | `text` (default `'header'`) | `header` or `footer` |
| `sortOrder` | `integer` (default 0) | Ordering within position |
| `isExternal` | `boolean` (default true) | Open in new tab? |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** INDEX on `(siteId, position, sortOrder)`.

### `socialLinks`

Social media / external platform links.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `siteId` | `uuid` → `sites.id` (NOT NULL) | |
| `platform` | `text` (NOT NULL) | e.g., `discord`, `twitter`, `youtube`, `twitch` |
| `label` | `text` | Display label, defaults to platform name |
| `url` | `text` (NOT NULL) | |
| `icon` | `text` | Icon identifier if custom |
| `sortOrder` | `integer` (default 0) | |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** INDEX on `(siteId, sortOrder)`.

### `events`

Scheduled events / watch parties / screenings.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `siteId` | `uuid` → `sites.id` (NOT NULL) | |
| `title` | `text` (NOT NULL) | |
| `description` | `text` | |
| `eventType` | `text` (default `'screening'`) | `screening`, `watch_party`, `meetup`, `other` |
| `startTime` | `timestamptz` (NOT NULL) | |
| `endTime` | `timestamptz` | Optional duration |
| `timezone` | `text` (default `'America/New_York'`) | IANA timezone |
| `location` | `text` | e.g., "Discord Stage", "VR Chat" |
| `externalLink` | `text` | Link to event page, stream |
| `imageCdnKey` | `text` | Optional event image |
| `isPublished` | `boolean` (default false) | Draft mode |
| `isRecurring` | `boolean` (default false) | Placeholder for future |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** INDEX on `(siteId, startTime)`. INDEX on `(siteId, isPublished)`.

## Drizzle Patterns

### Schema Definition ([`src/lib/server/db/schema.ts`](src/lib/server/db/schema.ts))

```ts
import { pgTable, uuid, text, boolean, timestamp, integer, jsonb, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['owner', 'admin', 'editor']);

export const events = pgTable(
    'events',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
        title: text('title').notNull(),
        // ...
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
    },
    (table) => [
        index('events_site_id_start_time_idx').on(table.siteId, table.startTime),
    ]
);
```

### Querying with Site Scope

```ts
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';

// Scoped to current site
const upcomingEvents = await db
    .select()
    .from(events)
    .where(
        and(
            eq(events.siteId, locals.site.id),
            eq(events.isPublished, true),
            gte(events.startTime, new Date())
        )
    )
    .orderBy(asc(events.startTime));
```

### Inserting

```ts
const [newEvent] = await db
    .insert(events)
    .values({
        siteId: locals.site.id,
        title: 'Bad Movie Night',
        startTime: new Date('2025-06-15T20:00:00Z'),
        isPublished: false,
    })
    .returning();
```

### Updating

```ts
await db
    .update(events)
    .set({ title: 'Updated Title', isPublished: true })
    .where(
        and(
            eq(events.id, eventId),
            eq(events.siteId, locals.site.id)  // NEVER forget this!
        )
    );
```

## Migration Strategy

1. **Additive changes only** in production — new columns, new tables. Avoid renames or destructive changes.
2. **Make schema changes in `schema.ts` first**, then generate the migration:
   ```bash
   npx drizzle-kit generate
   ```
3. **Apply via the primary deployment** (the one with `RUN_MIGRATIONS=true`)
4. **JSON columns for settings** reduce migration frequency for feature additions
5. **Seed script** at [`scripts/seed.mjs`](scripts/seed.mjs) for local dev setup

## What This Schema Intentionally Avoids (V1)

- **No `accounts` or `sessions` tables** — Better Auth manages those
- **No `pages` table** — homepage content lives in `siteSettings.homepage` JSON
- **No `reviews`, `comments`, `posts` tables** — future phases
- **No `featureFlags` table** — use env vars or settings JSON
- **No `domains` table** — single `SITE_SLUG` resolution in V1
- **No `auditLog` table** — future phase
- **No `invitations` table** — owner adds admins directly
