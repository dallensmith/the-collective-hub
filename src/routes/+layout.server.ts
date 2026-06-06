import type { LayoutServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users, memberships } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { getCdnUrl } from '$lib/server/cdn';
import { getSiteBySlug } from '$lib/server/site-resolver';

/**
 * Root layout server load — runs on every page navigation.
 *
 * Responsibilities:
 * 1. Parse SUPER_ADMIN_DISCORD_IDS env var for super admin access
 * 2. Load the Better Auth session (if any)
 * 3. Sync the authenticated user to our application `users` table
 * 4. Perform owner bootstrap: if user's Discord ID matches OWNER_DISCORD_ID,
 *    upsert a membership with role 'owner' for the current site
 * 5. Check if user is a super admin (bypasses site-scoped membership)
 * 6. Load the user's membership for the current site
 * 7. Return site, user, membership, and isSuperAdmin data to all pages
 */
export const load: LayoutServerLoad = async (event) => {
	const { site, siteSlug, siteSettings } = event.locals;

	// ─── Super Admin IDs ────────────────────────────────────────────────────
	// Parse SUPER_ADMIN_DISCORD_IDS env var (comma-separated list of Discord IDs).
	// Users whose Discord ID is in this list bypass all site-scoped membership
	// checks and get full admin access to any site.
	const superAdminIds = (env.SUPER_ADMIN_DISCORD_IDS ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);

	let isSuperAdmin = false;

	// Get session from Better Auth
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	let appUser: (typeof users.$inferSelect) | null = null;
	let membership: (typeof memberships.$inferSelect) | null = null;

	if (session?.user && site) {
		// --- Sync application user ---
		// Better Auth stores OAuth provider info in its `account` table.
		// We query Better Auth's tables to get the Discord account details.
		const accountList = await auth.api.listUserAccounts({
			headers: event.request.headers
		});

		const discordAccount = accountList.find((a) => a.providerId === 'discord');

		if (discordAccount) {
			const now = new Date();

			// Upsert into our application users table
			await db
				.insert(users)
				.values({
					discordId: discordAccount.accountId,
					discordUsername: session.user.name,
					discordAvatar: session.user.image ?? null,
					email: session.user.email,
					lastLoginAt: now
				})
				.onConflictDoUpdate({
					target: users.discordId,
					set: {
						discordUsername: session.user.name,
						discordAvatar: session.user.image ?? null,
						email: session.user.email,
						lastLoginAt: now,
						updatedAt: now
					}
				});

			// Fetch the upserted user
			const [fetchedUser] = await db
				.select()
				.from(users)
				.where(eq(users.discordId, discordAccount.accountId))
				.limit(1);

			appUser = fetchedUser ?? null;

			// --- Super Admin Resolution ---
			// Check BEFORE owner bootstrap so super admins always get the flag
			// regardless of whether they also happen to be the owner.
			if (appUser && superAdminIds.includes(discordAccount.accountId)) {
				isSuperAdmin = true;
			}

			// --- Owner Bootstrap ---
			// If this user's Discord ID matches OWNER_DISCORD_ID, ensure they
			// have an 'owner' membership for the current site.
			if (appUser && discordAccount.accountId === env.OWNER_DISCORD_ID) {
				await db
					.insert(memberships)
					.values({
						siteId: site.id,
						userId: appUser.id,
						role: 'owner'
					})
					.onConflictDoUpdate({
						target: [memberships.siteId, memberships.userId],
						set: {
							role: 'owner',
							updatedAt: now
						}
					});
			}

			// --- Load Membership ---
			if (appUser) {
				const [memberRow] = await db
					.select()
					.from(memberships)
					.where(
						and(
							eq(memberships.siteId, site.id),
							eq(memberships.userId, appUser.id)
						)
					)
					.limit(1);

				membership = memberRow ?? null;
			}
		}
	}

	// Attach to locals for downstream use (e.g., admin guard)
	event.locals.user = appUser
		? {
				id: appUser.id,
				discordId: appUser.discordId,
				discordUsername: appUser.discordUsername ?? session!.user.name,
				discordAvatar: appUser.discordAvatar,
				email: appUser.email
			}
		: null;
	event.locals.membership = membership;
	event.locals.isSuperAdmin = isSuperAdmin;

	// --- Preview Mode Authorization Refinement ---
	// hooks.server.ts provisionally sets isPreviewing based on token validity.
	// Here we refine it: the user must be authenticated AND authorized for the site.
	let isPreviewing = event.locals.isPreviewing;

	if (isPreviewing) {
		const isAuthorizedForPreview =
			isSuperAdmin ||
			(membership && ['owner', 'admin', 'editor'].includes(membership.role));

		if (!isAuthorizedForPreview) {
			// User is not authorized — disable preview mode
			isPreviewing = false;
			event.locals.isPreviewing = false;
			event.cookies.delete('ct_preview', { path: '/' });

			// Re-load site settings without preview (live settings)
			if (siteSlug) {
				const liveContext = await getSiteBySlug(siteSlug, { preview: false });
				event.locals.siteSettings = liveContext.settings;
			}
		} else if (siteSlug) {
			// User is authorized — ensure siteSettings has draft-merged data
			// (hooks already loaded with preview=true, but re-load to be safe)
			const previewContext = await getSiteBySlug(siteSlug, { preview: true });
			event.locals.siteSettings = previewContext.settings;
		}
	}

	// Compute favicon URL server-side so the client doesn't need getCdnUrl
	const currentSettings = event.locals.siteSettings ?? siteSettings;
	const faviconUrl = currentSettings?.branding?.faviconCdnKey
		? getCdnUrl(currentSettings.branding.faviconCdnKey)
		: null;

	return {
		site,
		siteSlug,
		siteSettings: currentSettings,
		user: event.locals.user,
		membership,
		isSuperAdmin,
		faviconUrl,
		isPreviewing
	};
};
