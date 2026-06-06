/**
 * Discord REST API client for The Collective Hub.
 *
 * Uses the existing Discord Bot (DISCORD_BOT_TOKEN env var) to interact with
 * Discord's REST API. All calls use native `fetch` — no discord.js dependency.
 *
 * Includes a simple in-memory cache for guild scheduled events with a 60-second TTL.
 */

import { env } from '$env/dynamic/private';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Raw scheduled event from Discord's API */
interface DiscordRawEvent {
	id: string;
	guild_id: string;
	name: string;
	description: string | null;
	scheduled_start_time: string;
	scheduled_end_time: string | null;
	status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
	entity_type: 'STAGE_INSTANCE' | 'VOICE' | 'EXTERNAL';
	entity_metadata: {
		location?: string;
	} | null;
	image: string | null;
	creator_id: string | null;
}

/** Normalized Discord event for site display */
export interface DiscordEvent {
	id: string;
	guildId: string;
	name: string;
	description: string | null;
	startTime: string;
	endTime: string | null;
	status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
	entityType: 'STAGE_INSTANCE' | 'VOICE' | 'EXTERNAL';
	location: string | null;
	imageUrl: string | null;
	creatorId: string | null;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry {
	events: DiscordEvent[];
	fetchedAt: number;
}

/** In-memory cache keyed by guild ID. TTL = 60 seconds. */
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function botToken(): string {
	const token = env.DISCORD_BOT_TOKEN?.trim();
	if (!token) {
		throw new Error('DISCORD_BOT_TOKEN environment variable is not set.');
	}
	return token;
}

/**
 * Make an authenticated GET request to the Discord API.
 * Returns `null` on 404 (guild/event not found) or 403 (bot not in server).
 * Throws on other errors.
 */
async function discordGet<T>(path: string): Promise<T | null> {
	const url = `https://discord.com/api/v10${path}`;

	const res = await fetch(url, {
		headers: {
			Authorization: `Bot ${botToken()}`,
			'Content-Type': 'application/json'
		}
	});

	if (res.status === 404 || res.status === 403) {
		return null;
	}

	if (res.status === 429) {
		const retryAfter = res.headers.get('Retry-After');
		const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : 5000;
		console.warn(`[discord] Rate limited. Waiting ${waitMs}ms before retry.`);
		await new Promise((r) => setTimeout(r, waitMs));
		return discordGet<T>(path);
	}

	if (!res.ok) {
		const body = await res.text();
		throw new Error(
			`Discord API error ${res.status} for ${path}: ${body.slice(0, 200)}`
		);
	}

	return (await res.json()) as T;
}

/**
 * Normalize a raw Discord event into the application's DiscordEvent shape.
 */
function normalizeEvent(raw: DiscordRawEvent): DiscordEvent {
	return {
		id: raw.id,
		guildId: raw.guild_id,
		name: raw.name,
		description: raw.description,
		startTime: raw.scheduled_start_time,
		endTime: raw.scheduled_end_time,
		status: raw.status,
		entityType: raw.entity_type,
		location: raw.entity_metadata?.location ?? null,
		imageUrl: raw.image
			? `https://cdn.discordapp.com/guild-events/${raw.id}/${raw.image}.png`
			: null,
		creatorId: raw.creator_id
	};
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch scheduled events for a guild.
 *
 * Returns only SCHEDULED and ACTIVE events, sorted by start time ascending.
 * Results are cached in-memory for 60 seconds.
 *
 * Returns an empty array if:
 * - The bot is not in the server (403)
 * - The guild doesn't exist (404)
 * - No events exist
 * - The token is not configured
 */
export async function getScheduledEvents(guildId: string): Promise<DiscordEvent[]> {
	// Check cache
	const cached = cache.get(guildId);
	if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
		return cached.events;
	}

	// Skip if no bot token configured
	if (!env.DISCORD_BOT_TOKEN?.trim()) {
		console.warn('[discord] DISCORD_BOT_TOKEN not set — skipping event fetch.');
		return [];
	}

	try {
		const raw = await discordGet<DiscordRawEvent[]>(
			`/guilds/${guildId}/scheduled-events?with_user_count=false`
		);

		if (!raw) {
			// Bot not in server or guild not found
			cache.set(guildId, { events: [], fetchedAt: Date.now() });
			return [];
		}

		const events = raw
			.filter((e) => e.status === 'SCHEDULED' || e.status === 'ACTIVE')
			.map(normalizeEvent)
			.sort(
				(a, b) =>
					new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
			);

		cache.set(guildId, { events, fetchedAt: Date.now() });
		return events;
	} catch (err) {
		console.error(`[discord] Failed to fetch events for guild ${guildId}:`, err);
		// Return cached data if available, even if stale
		if (cached) {
			console.warn('[discord] Returning stale cached data.');
			return cached.events;
		}
		return [];
	}
}

/**
 * Verify the bot is in a guild and return basic guild info.
 * Returns `null` if the bot is not in the server or the guild doesn't exist.
 */
export async function getGuild(
	guildId: string
): Promise<{ id: string; name: string } | null> {
	if (!env.DISCORD_BOT_TOKEN?.trim()) return null;

	try {
		return await discordGet<{ id: string; name: string }>(`/guilds/${guildId}`);
	} catch (err) {
		console.error(`[discord] Failed to fetch guild ${guildId}:`, err);
		return null;
	}
}

/**
 * Clear the events cache for a specific guild, or all guilds if no guildId is given.
 */
export function clearEventCache(guildId?: string): void {
	if (guildId) {
		cache.delete(guildId);
	} else {
		cache.clear();
	}
}
