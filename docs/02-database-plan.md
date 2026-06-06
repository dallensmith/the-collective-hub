# Database Planning Document

## Design Principles

- **siteId on every site-owned table.** Non-negotiable.
- **Prefer normalized tables over JSON columns** — except for theme/branding settings where flexibility is valuable.
- **Timestamps on every table** (`createdAt`, `updatedAt`).
- **Use UUIDs for primary keys** — avoids sequential ID enumeration and works well distributed.
- **Index `siteId` on every table that has it** — it's the most common query filter.
- **Soft deletes where appropriate** — prefer `deletedAt` over hard deletes for content that might be needed later.

---

## Tables

### `sites`

The core tenant table. One row per deployed site.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `slug` | `text` (UNIQUE, NOT NULL) | Matches `SITE_SLUG` env var |
| `name` | `text` (NOT NULL) | Display name |
| `isActive` | `boolean` (default true) | Soft disable a site |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** UNIQUE on `slug`.

---

### `users`

Auth users. Created automatically on first Discord login.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `discordId` | `text` (UNIQUE, NOT NULL) | Discord user ID |
| `discordUsername` | `text` | Display name from Discord |
| `discordAvatar` | `text` | Avatar hash/URL from Discord |
| `email` | `text` | If available from Discord scope |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |
| `lastLoginAt` | `timestamptz` | |

**Indexes:** UNIQUE on `discordId`.

**Note:** Better Auth manages its own session/account tables. The `users` table here is the application-level user profile. Better Auth tables are separate and managed by the library.

---

### `memberships`

Links users to sites with a role. A user can be a member of multiple sites with different roles.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `siteId` | `uuid` → `sites.id` (NOT NULL) | |
| `userId` | `uuid` → `users.id` (NOT NULL) | |
| `role` | `enum('owner', 'admin', 'editor')` | See role definitions below |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** UNIQUE on `(siteId, userId)`. INDEX on `siteId`. INDEX on `userId`.

**Role Definitions (V1):**
- **owner** — Full control. Bootstrap via `OWNER_DISCORD_ID`. Can manage admins. One per site initially.
- **admin** — Can edit all site settings and content. Cannot delete the site or manage the owner.
- **editor** — Can edit content (events, pages) but not site settings or branding.

Future roles: `viewer`, `moderator` — not needed in V1.

---

### `siteSettings`

Key-value or JSON settings for a site. Two approaches are viable; recommendation below.

**Recommended approach: Single JSON column per site**

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `siteId` | `uuid` → `sites.id` (UNIQUE, NOT NULL) | One settings row per site |
| `settings` | `jsonb` (NOT NULL, default `{}`) | All site settings as JSON |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** UNIQUE on `siteId`.

The `settings` JSON would contain:

```json
{
  "branding": {
    "siteName": "Bad Movies Theater",
    "tagline": "Terrible movies, great company",
    "logoCdnKey": "sites/bad-movies-theater/logo.webp",
    "backgroundCdnKey": "sites/bad-movies-theater/background.webp",
    "faviconCdnKey": null
  },
  "theme": {
    "preset": "dark",
    "accentColor": "#e63946",
    "backgroundColor": "#1a1a2e",
    "textColor": "#eaeaea"
  },
  "homepage": {
    "heroTitle": "Welcome to Bad Movies Theater",
    "heroSubtitle": "We watch bad movies so you don't have to",
    "aboutText": "A community of bad movie enthusiasts...",
    "primaryButtonText": "Join us on Discord",
    "primaryButtonLink": "https://discord.gg/example",
    "showNextEvent": true,
    "showSchedule": true
  },
  "layout": {
    "preset": "standard"
  }
}
```

**Why JSON for settings?** Settings are read as a batch, rarely queried individually, and benefit from schema flexibility. If you add a new setting, no migration is needed.

**Alternative (not recommended for V1):** Key-value table with `siteId`, `key`, `value` columns. More queryable but more complex for nested settings.

---

### `assets`

Records of uploaded or referenced media files stored in the CDN.

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

**V1 approach:** Assets table may start as a manual-reference table (paste CDN URLs) before automatic upload flow is built. This is fine — the table structure supports both.

---

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

---

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

---

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
| `endTime` | `timestamptz` | Optional, for duration |
| `timezone` | `text` (default `'America/New_York'`) | IANA timezone |
| `location` | `text` | e.g., "Discord Stage", "VR Chat", "Online" |
| `externalLink` | `text` | Link to event page, stream, etc. |
| `imageCdnKey` | `text` | Optional event image |
| `isPublished` | `boolean` (default false) | Draft mode |
| `isRecurring` | `boolean` (default false) | Placeholder for future recurring support |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** INDEX on `(siteId, startTime)`. INDEX on `(siteId, isPublished)`.

**Recurring events:** V1 treats all events as one-off. The `isRecurring` flag is a placeholder. A future phase could add a `recurrenceRule` field (JSON or a separate table) for repeat patterns. Don't build recurring logic in V1.

---

### `homepageSections` (Optional V1)

If the homepage needs more structure than a single text block, sections allow ordered content blocks.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `siteId` | `uuid` → `sites.id` (NOT NULL) | |
| `type` | `text` (NOT NULL) | `hero`, `about`, `events`, `links`, `custom` |
| `title` | `text` | Section heading |
| `content` | `text` | Markdown or plain text |
| `settings` | `jsonb` | Section-specific config |
| `sortOrder` | `integer` (default 0) | |
| `isVisible` | `boolean` (default true) | |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Indexes:** INDEX on `(siteId, sortOrder)`.

**V1 recommendation:** Start without this table. Use the `homepage` JSON in `siteSettings` for the first version. Add sections in Phase 2+ if sites need more flexible page building.

---

## Entity Relationship Summary

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

---

## Migration Strategy

1. **All migrations run manually** — not on app startup. David runs `drizzle-kit migrate` locally or via a primary deployment.
2. **Additive changes only in production** — new columns, new tables. Avoid renames or destructive changes without a plan.
3. **JSON columns for settings** reduce migration frequency for feature additions.
4. **Seed data** — a seed script can populate the initial site record for a new deployment, or David creates the site row manually.

## What This Schema Intentionally Avoids

- **No `accounts` or `sessions` tables** — Better Auth manages those.
- **No `pages` table for V1** — homepage content lives in `siteSettings.homepage` JSON.
- **No `reviews`, `comments`, `posts` tables** — future phases.
- **No `featureFlags` table** — use env vars or settings JSON for now.
- **No `domains` table** — single `SITE_SLUG` resolution in V1.
- **No `auditLog` table** — nice to have later, not needed for V1.
- **No `invitations` table** — owner adds admins directly in V1, no invite flow.
