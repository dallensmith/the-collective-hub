import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { error, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { logAuditEvent } from '$lib/server/audit-log';

/**
 * Load all events for the current site, ordered by startTime descending (newest first).
 * When Discord events are enabled, returns a flag so the page can show a notice
 * instead of the native event manager.
 */
export const load: PageServerLoad = async (event) => {
	const { site } = event.locals;

	if (!site) {
		return { events: [], discordEventsEnabled: false, discordGuildId: null };
	}

	// Feature flag guard: events must be enabled
	if (event.locals.siteSettings?.featureFlags?.events === false) {
		throw error(403, 'The Events feature is disabled for this site.');
	}

	const discordConfig = event.locals.siteSettings?.discord;
	const discordEventsEnabled = discordConfig?.eventsEnabled === true && discordConfig?.guildId != null;
	const discordGuildId = discordConfig?.guildId ?? null;

	// When Discord events are enabled, skip native event queries
	if (discordEventsEnabled) {
		return {
			events: [],
			discordEventsEnabled: true,
			discordGuildId
		};
	}

	const eventRows = await db
		.select()
		.from(events)
		.where(eq(events.siteId, site.id))
		.orderBy(desc(events.startTime));

	return {
		events: eventRows,
		discordEventsEnabled: false,
		discordGuildId: null
	};
};

/**
 * Named form actions for CRUD operations on events.
 */
export const actions: Actions = {
	// ─── Create ───────────────────────────────────────────────────────────

	create: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const title = formData.get('title')?.toString().trim();
		const description = formData.get('description')?.toString().trim() || null;
		const eventType = formData.get('eventType')?.toString().trim() || 'screening';
		const startTimeStr = formData.get('startTime')?.toString().trim();
		const endTimeStr = formData.get('endTime')?.toString().trim() || null;
		const timezone = formData.get('timezone')?.toString().trim() || 'America/New_York';
		const location = formData.get('location')?.toString().trim() || null;
		const externalLink = formData.get('externalLink')?.toString().trim() || null;
		const imageCdnKey = formData.get('imageCdnKey')?.toString().trim() || null;
		const isPublished = formData.get('isPublished') === 'on';

		// Validation
		if (!title) {
			return { success: false, error: 'Title is required.', action: 'create' };
		}
		if (!startTimeStr) {
			return { success: false, error: 'Start time is required.', action: 'create' };
		}

		const startTime = new Date(startTimeStr);
		if (isNaN(startTime.getTime())) {
			return { success: false, error: 'Start time must be a valid date.', action: 'create' };
		}

		let endTime: Date | null = null;
		if (endTimeStr) {
			endTime = new Date(endTimeStr);
			if (isNaN(endTime.getTime())) {
				return { success: false, error: 'End time must be a valid date.', action: 'create' };
			}
			if (endTime <= startTime) {
				return { success: false, error: 'End time must be after start time.', action: 'create' };
			}
		}

		// Validate eventType
		const validTypes = ['screening', 'watch_party', 'meetup', 'other'];
		const finalEventType = validTypes.includes(eventType) ? eventType : 'screening';

		try {
			const [created] = await db
				.insert(events)
				.values({
					siteId: site.id,
					title,
					description,
					eventType: finalEventType,
					startTime,
					endTime,
					timezone,
					location,
					externalLink,
					imageCdnKey,
					isPublished
				})
				.returning({ id: events.id });

			if (created) {
				logAuditEvent({
					siteId: site.id,
					userId: event.locals.user?.discordId ?? 'unknown',
					userEmail: event.locals.user?.email,
					action: 'create',
					entityType: 'event',
					entityId: created.id,
					details: JSON.stringify({ title, eventType: finalEventType })
				});
			}

			return { success: true, action: 'create' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to create event.';
			return { success: false, error: message, action: 'create' };
		}
	},

	// ─── Update ───────────────────────────────────────────────────────────

	update: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();
		const title = formData.get('title')?.toString().trim();
		const description = formData.get('description')?.toString().trim() || null;
		const eventType = formData.get('eventType')?.toString().trim() || 'screening';
		const startTimeStr = formData.get('startTime')?.toString().trim();
		const endTimeStr = formData.get('endTime')?.toString().trim() || null;
		const timezone = formData.get('timezone')?.toString().trim() || 'America/New_York';
		const location = formData.get('location')?.toString().trim() || null;
		const externalLink = formData.get('externalLink')?.toString().trim() || null;
		const imageCdnKey = formData.get('imageCdnKey')?.toString().trim() || null;
		const isPublished = formData.get('isPublished') === 'on';

		if (!id) return { success: false, error: 'Event ID is required.', action: 'update' };
		if (!title) return { success: false, error: 'Title is required.', action: 'update' };
		if (!startTimeStr) return { success: false, error: 'Start time is required.', action: 'update' };

		const startTime = new Date(startTimeStr);
		if (isNaN(startTime.getTime())) {
			return { success: false, error: 'Start time must be a valid date.', action: 'update' };
		}

		let endTime: Date | null = null;
		if (endTimeStr) {
			endTime = new Date(endTimeStr);
			if (isNaN(endTime.getTime())) {
				return { success: false, error: 'End time must be a valid date.', action: 'update' };
			}
			if (endTime <= startTime) {
				return { success: false, error: 'End time must be after start time.', action: 'update' };
			}
		}

		// Verify siteId matches
		const [existing] = await db
			.select({ id: events.id, siteId: events.siteId })
			.from(events)
			.where(eq(events.id, id))
			.limit(1);

		if (!existing) {
			return { success: false, error: 'Event not found.', action: 'update' };
		}
		if (existing.siteId !== site.id) {
			return { success: false, error: 'Event does not belong to this site.', action: 'update' };
		}

		const validTypes = ['screening', 'watch_party', 'meetup', 'other'];
		const finalEventType = validTypes.includes(eventType) ? eventType : 'screening';

		try {
			await db
				.update(events)
				.set({
					title,
					description,
					eventType: finalEventType,
					startTime,
					endTime,
					timezone,
					location,
					externalLink,
					imageCdnKey,
					isPublished,
					updatedAt: new Date()
				})
				.where(eq(events.id, id));

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'event',
				entityId: id,
				details: JSON.stringify({ title, eventType: finalEventType })
			});

			return { success: true, action: 'update' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to update event.';
			return { success: false, error: message, action: 'update' };
		}
	},

	// ─── Delete ───────────────────────────────────────────────────────────

	delete: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();

		if (!id) return { success: false, error: 'Event ID is required.', action: 'delete' };

		// Verify siteId matches before deleting
		const [existing] = await db
			.select({ id: events.id, siteId: events.siteId })
			.from(events)
			.where(eq(events.id, id))
			.limit(1);

		if (!existing) {
			return { success: false, error: 'Event not found.', action: 'delete' };
		}
		if (existing.siteId !== site.id) {
			return { success: false, error: 'Event does not belong to this site.', action: 'delete' };
		}

		try {
			await db.delete(events).where(eq(events.id, id));

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'delete',
				entityType: 'event',
				entityId: id
			});

			return { success: true, action: 'delete' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to delete event.';
			return { success: false, error: message, action: 'delete' };
		}
	},

	// ─── Toggle Publish ───────────────────────────────────────────────────

	togglePublish: async (event) => {
		const { site } = event.locals;
		if (!site) return { success: false, error: 'No site context found.' };

		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();

		if (!id) return { success: false, error: 'Event ID is required.', action: 'togglePublish' };

		// Verify siteId matches
		const [existing] = await db
			.select({ id: events.id, siteId: events.siteId, isPublished: events.isPublished })
			.from(events)
			.where(eq(events.id, id))
			.limit(1);

		if (!existing) {
			return { success: false, error: 'Event not found.', action: 'togglePublish' };
		}
		if (existing.siteId !== site.id) {
			return { success: false, error: 'Event does not belong to this site.', action: 'togglePublish' };
		}

		try {
			await db
				.update(events)
				.set({ isPublished: !existing.isPublished, updatedAt: new Date() })
				.where(eq(events.id, id));

			logAuditEvent({
				siteId: site.id,
				userId: event.locals.user?.discordId ?? 'unknown',
				userEmail: event.locals.user?.email,
				action: 'update',
				entityType: 'event',
				entityId: id,
				details: JSON.stringify({ isPublished: !existing.isPublished })
			});

			return { success: true, action: 'togglePublish' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to toggle publish status.';
			return { success: false, error: message, action: 'togglePublish' };
		}
	}
};
