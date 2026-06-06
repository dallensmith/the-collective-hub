import {
	pgTable,
	uuid,
	text,
	boolean,
	timestamp,
	integer,
	jsonb,
	uniqueIndex,
	index,
	pgEnum
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', ['owner', 'admin', 'editor']);

// ─── Sites ───────────────────────────────────────────────────────────────────

export const sites = pgTable(
	'sites',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		slug: text('slug').notNull().unique(),
		name: text('name').notNull(),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		uniqueIndex('sites_slug_idx').on(table.slug)
	]
);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable(
	'users',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		discordId: text('discord_id').notNull().unique(),
		discordUsername: text('discord_username'),
		discordAvatar: text('discord_avatar'),
		email: text('email'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		lastLoginAt: timestamp('last_login_at', { withTimezone: true })
	},
	(table) => [
		uniqueIndex('users_discord_id_idx').on(table.discordId)
	]
);

// ─── Memberships ─────────────────────────────────────────────────────────────

export const memberships = pgTable(
	'memberships',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		siteId: uuid('site_id')
			.notNull()
			.references(() => sites.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		role: roleEnum('role').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		uniqueIndex('memberships_site_user_idx').on(table.siteId, table.userId),
		index('memberships_site_id_idx').on(table.siteId),
		index('memberships_user_id_idx').on(table.userId)
	]
);

// ─── Site Settings ───────────────────────────────────────────────────────────

export const siteSettings = pgTable(
	'site_settings',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		siteId: uuid('site_id')
			.notNull()
			.unique()
			.references(() => sites.id, { onDelete: 'cascade' }),
		settings: jsonb('settings').notNull().default({}),
		draftSettings: jsonb('draft_settings'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		uniqueIndex('site_settings_site_id_idx').on(table.siteId)
	]
);

// ─── Assets ──────────────────────────────────────────────────────────────────

export const assets = pgTable(
	'assets',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		siteId: uuid('site_id')
			.notNull()
			.references(() => sites.id, { onDelete: 'cascade' }),
		uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, {
			onDelete: 'set null'
		}),
		type: text('type').notNull(),
		filename: text('filename').notNull(),
		mimeType: text('mime_type'),
		size: integer('size'),
		cdnKey: text('cdn_key').notNull(),
		altText: text('alt_text'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('assets_site_id_idx').on(table.siteId),
		index('assets_cdn_key_idx').on(table.cdnKey)
	]
);

// ─── Nav Links ───────────────────────────────────────────────────────────────

export const navLinks = pgTable(
	'nav_links',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		siteId: uuid('site_id')
			.notNull()
			.references(() => sites.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		url: text('url').notNull(),
		position: text('position').notNull().default('header'),
		sortOrder: integer('sort_order').notNull().default(0),
		isExternal: boolean('is_external').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('nav_links_site_position_order_idx').on(table.siteId, table.position, table.sortOrder)
	]
);

// ─── Social Links ────────────────────────────────────────────────────────────

export const socialLinks = pgTable(
	'social_links',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		siteId: uuid('site_id')
			.notNull()
			.references(() => sites.id, { onDelete: 'cascade' }),
		platform: text('platform').notNull(),
		label: text('label'),
		url: text('url').notNull(),
		icon: text('icon'),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('social_links_site_order_idx').on(table.siteId, table.sortOrder)
	]
);

// ─── Events ──────────────────────────────────────────────────────────────────

export const events = pgTable(
	'events',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		siteId: uuid('site_id')
			.notNull()
			.references(() => sites.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description'),
		eventType: text('event_type').notNull().default('screening'),
		startTime: timestamp('start_time', { withTimezone: true }).notNull(),
		endTime: timestamp('end_time', { withTimezone: true }),
		timezone: text('timezone').notNull().default('America/New_York'),
		location: text('location'),
		externalLink: text('external_link'),
		imageCdnKey: text('image_cdn_key'),
		isPublished: boolean('is_published').notNull().default(false),
		isRecurring: boolean('is_recurring').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('events_site_start_idx').on(table.siteId, table.startTime),
		index('events_site_published_idx').on(table.siteId, table.isPublished)
	]
);

// ─── Type Exports ────────────────────────────────────────────────────────────

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type NavLink = typeof navLinks.$inferSelect;
export type NewNavLink = typeof navLinks.$inferInsert;

export type SocialLink = typeof socialLinks.$inferSelect;
export type NewSocialLink = typeof socialLinks.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
