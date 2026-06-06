import { db } from '$lib/server/db';
import { memberships, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const rolePriority: Record<string, number> = {
	owner: 0,
	admin: 1,
	editor: 2
};

/**
 * Load all team members for the current site.
 * Joins memberships with users to get Discord profile info.
 * Sorted by role priority (owner → admin → editor) then by username.
 */
export const load: PageServerLoad = async (event) => {
	const { site, membership, isSuperAdmin } = event.locals;

	if (!site) {
		return { members: [], currentUserRole: null, isSuperAdmin: false };
	}

	const rows = await db
		.select({
			membershipId: memberships.id,
			userId: users.id,
			discordUsername: users.discordUsername,
			discordAvatar: users.discordAvatar,
			discordId: users.discordId,
			role: memberships.role,
			createdAt: memberships.createdAt
		})
		.from(memberships)
		.innerJoin(users, eq(memberships.userId, users.id))
		.where(eq(memberships.siteId, site.id));

	// Sort: owner first, then admin, then editor; within same role, sort by username
	const sorted = rows.sort((a, b) => {
		const pA = rolePriority[a.role] ?? 99;
		const pB = rolePriority[b.role] ?? 99;
		if (pA !== pB) return pA - pB;
		return (a.discordUsername ?? '').localeCompare(b.discordUsername ?? '');
	});

	/** Build Discord avatar URL */
	function avatarUrl(discordId: string, avatarHash: string | null): string {
		if (avatarHash) {
			return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`;
		}
		const defaultIndex = (parseInt(discordId) >> 22) % 6;
		return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
	}

	const memberList = sorted.map((m) => ({
		membershipId: m.membershipId,
		userId: m.userId,
		discordUsername: m.discordUsername ?? 'Unknown User',
		discordAvatarUrl: avatarUrl(m.discordId, m.discordAvatar),
		role: m.role,
		createdAt: m.createdAt
	}));

	return {
		members: memberList,
		currentUserRole: membership?.role ?? null,
		isSuperAdmin
	};
};

/**
 * Team management actions: addMember, changeRole, removeMember.
 * Only the site owner (or a super admin) can perform these actions.
 */
export const actions: Actions = {
	// ─── Add Member ──────────────────────────────────────────────────────────

	addMember: async (event) => {
		const { site, membership, isSuperAdmin } = event.locals;

		if (!site) {
			return { success: false, error: 'No site context found.', action: 'addMember' };
		}

		// Only owner or super admin can add members
		const isOwner = membership?.role === 'owner';
		if (!isOwner && !isSuperAdmin) {
			return {
				success: false,
				error: 'Only the site owner can add team members.',
				action: 'addMember'
			};
		}

		const formData = await event.request.formData();
		const discordId = formData.get('discordId')?.toString().trim();
		const role = formData.get('role')?.toString().trim();

		// Validate inputs
		if (!discordId) {
			return { success: false, error: 'Discord User ID is required.', action: 'addMember' };
		}

		if (role !== 'admin' && role !== 'editor') {
			return {
				success: false,
				error: 'Role must be either "admin" or "editor".',
				action: 'addMember'
			};
		}

		// Find the user by Discord ID
		const [targetUser] = await db
			.select()
			.from(users)
			.where(eq(users.discordId, discordId))
			.limit(1);

		if (!targetUser) {
			return {
				success: false,
				error: 'User not found. They must log in via Discord first.',
				action: 'addMember'
			};
		}

		// Check if user already has a membership for this site
		const [existingMembership] = await db
			.select({ id: memberships.id })
			.from(memberships)
			.where(
				and(eq(memberships.siteId, site.id), eq(memberships.userId, targetUser.id))
			)
			.limit(1);

		if (existingMembership) {
			return {
				success: false,
				error: 'This user is already a member of this site.',
				action: 'addMember'
			};
		}

		// Insert the membership
		try {
			await db.insert(memberships).values({
				siteId: site.id,
				userId: targetUser.id,
				role: role as 'admin' | 'editor'
			});

			/** Build Discord avatar URL */
			function avatarUrl(dId: string, avatarHash: string | null): string {
				if (avatarHash) {
					return `https://cdn.discordapp.com/avatars/${dId}/${avatarHash}.png`;
				}
				const defaultIndex = (parseInt(dId) >> 22) % 6;
				return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
			}

			return {
				success: true,
				action: 'addMember',
				member: {
					discordUsername: targetUser.discordUsername ?? 'Unknown User',
					discordAvatarUrl: avatarUrl(targetUser.discordId, targetUser.discordAvatar),
					role
				}
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to add member.';
			return { success: false, error: message, action: 'addMember' };
		}
	},

	// ─── Change Role ─────────────────────────────────────────────────────────

	changeRole: async (event) => {
		const { site, membership, isSuperAdmin } = event.locals;

		if (!site) {
			return { success: false, error: 'No site context found.', action: 'changeRole' };
		}

		// Only owner or super admin can change roles
		const isOwner = membership?.role === 'owner';
		if (!isOwner && !isSuperAdmin) {
			return {
				success: false,
				error: 'Only the site owner can change team member roles.',
				action: 'changeRole'
			};
		}

		const formData = await event.request.formData();
		const membershipId = formData.get('membershipId')?.toString().trim();
		const newRole = formData.get('newRole')?.toString().trim();

		if (!membershipId) {
			return {
				success: false,
				error: 'Membership ID is required.',
				action: 'changeRole'
			};
		}

		if (newRole !== 'admin' && newRole !== 'editor') {
			return {
				success: false,
				error: 'Role must be either "admin" or "editor".',
				action: 'changeRole'
			};
		}

		// Find the membership, scoped to this site
		const [targetMembership] = await db
			.select()
			.from(memberships)
			.where(
				and(eq(memberships.id, membershipId), eq(memberships.siteId, site.id))
			)
			.limit(1);

		if (!targetMembership) {
			return {
				success: false,
				error: 'Membership not found.',
				action: 'changeRole'
			};
		}

		// Cannot change the owner's role
		if (targetMembership.role === 'owner') {
			return {
				success: false,
				error: 'Cannot change the owner\'s role.',
				action: 'changeRole'
			};
		}

		try {
			await db
				.update(memberships)
				.set({ role: newRole as 'admin' | 'editor', updatedAt: new Date() })
				.where(eq(memberships.id, membershipId));

			return { success: true, action: 'changeRole' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to change role.';
			return { success: false, error: message, action: 'changeRole' };
		}
	},

	// ─── Remove Member ───────────────────────────────────────────────────────

	removeMember: async (event) => {
		const { site, membership, isSuperAdmin } = event.locals;

		if (!site) {
			return { success: false, error: 'No site context found.', action: 'removeMember' };
		}

		// Only owner or super admin can remove members
		const isOwner = membership?.role === 'owner';
		if (!isOwner && !isSuperAdmin) {
			return {
				success: false,
				error: 'Only the site owner can remove team members.',
				action: 'removeMember'
			};
		}

		const formData = await event.request.formData();
		const membershipId = formData.get('membershipId')?.toString().trim();

		if (!membershipId) {
			return {
				success: false,
				error: 'Membership ID is required.',
				action: 'removeMember'
			};
		}

		// Find the membership, scoped to this site
		const [targetMembership] = await db
			.select()
			.from(memberships)
			.where(
				and(eq(memberships.id, membershipId), eq(memberships.siteId, site.id))
			)
			.limit(1);

		if (!targetMembership) {
			return {
				success: false,
				error: 'Membership not found.',
				action: 'removeMember'
			};
		}

		// Cannot remove the owner
		if (targetMembership.role === 'owner') {
			return {
				success: false,
				error: 'Cannot remove the site owner.',
				action: 'removeMember'
			};
		}

		try {
			await db.delete(memberships).where(eq(memberships.id, membershipId));

			return { success: true, action: 'removeMember' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to remove member.';
			return { success: false, error: message, action: 'removeMember' };
		}
	}
};
