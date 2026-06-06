import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('$env/dynamic/private', () => ({
	env: {}
}));

vi.mock('$app/environment', () => ({
	building: false,
	dev: true,
	browser: false
}));

vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn(),
		update: vi.fn(),
		insert: vi.fn(),
		delete: vi.fn()
	}
}));

vi.mock('$lib/server/settings-writer', () => ({
	discardDrafts: vi.fn().mockResolvedValue(undefined)
}));

// Mock @sveltejs/kit redirect function
vi.mock('@sveltejs/kit', () => {
	class Redirect extends Error {
		status: number;
		location: string;
		constructor(status: number, location: string) {
			super(`Redirect: ${status} ${location}`);
			this.status = status;
			this.location = location;
			this.name = 'Redirect';
		}
	}
	return {
		redirect: (status: number, location: string) => {
			throw new Redirect(status, location);
		},
		Redirect
	};
});

import { load } from '../../routes/admin/+layout.server';
import type { Site, Membership } from '$lib/server/db/schema';

// Helper to create a mock event
function createMockEvent(overrides: {
	user?: {
		id: string;
		discordId: string;
		discordUsername: string;
		discordAvatar: string | null;
		email: string | null;
	} | null;
	membership?: Membership | null;
	site?: Site | null;
	isSuperAdmin?: boolean;
	siteSettings?: Record<string, unknown> | null;
}) {
	const defaultSite: Site = {
		id: 'site-123',
		slug: 'test-site',
		name: 'Test Site',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const defaultMembership: Membership = {
		id: 'member-1',
		siteId: 'site-123',
		userId: 'user-1',
		role: 'owner',
		createdAt: new Date(),
		updatedAt: new Date()
	};

	return {
		locals: {
			user: overrides.user === undefined ? {
				id: 'user-1',
				discordId: '123456789',
				discordUsername: 'TestUser',
				discordAvatar: 'abc123',
				email: 'test@example.com'
			} : overrides.user,
			membership: overrides.membership === undefined ? defaultMembership : overrides.membership,
			site: overrides.site === undefined ? defaultSite : overrides.site,
			isSuperAdmin: overrides.isSuperAdmin ?? false,
			siteSettings: overrides.siteSettings === undefined ? {} : overrides.siteSettings
		},
		url: new URL('http://localhost/admin'),
		params: {},
		route: { id: '/admin' },
		request: new Request('http://localhost/admin')
	} as unknown as Parameters<typeof load>[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResultData(result: any): Record<string, unknown> {
	return result as Record<string, unknown>;
}

describe('admin +layout.server load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('unauthenticated user', () => {
		it('should throw redirect to /login when locals.user is null', async () => {
			const event = createMockEvent({ user: null });
			try {
				await load(event);
				expect.fail('Expected redirect to be thrown');
			} catch (e) {
				expect(e).toBeInstanceOf(Error);
				expect((e as Error).message).toContain('Redirect');
				expect((e as Error).message).toContain('/login');
				expect((e as Error).message).toContain('303');
			}
		});
	});

	describe('super admin', () => {
		it('should NOT redirect — returns data with isSuperAdmin: true', async () => {
			const event = createMockEvent({
				isSuperAdmin: true,
				membership: null,
				user: {
					id: 'super-1',
					discordId: '99999',
					discordUsername: 'SuperAdmin',
					discordAvatar: null,
					email: null
				}
			});

			// Mock the DB query for hasDrafts
			const { db } = await import('$lib/server/db');
			const mockChain = {
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([{ draftSettings: null }])
			};
			(db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

			const result = await load(event);
			const data = getResultData(result);
			expect(data.isSuperAdmin).toBe(true);
			expect(data.membership).toBeNull();
			expect(data.site).toBeDefined();
			expect(data.user).toBeDefined();
			// hasDrafts should be false since draftSettings is null
			expect(data.hasDrafts).toBe(false);
		});

		it('super admin with hasDrafts=true when draftSettings exists', async () => {
			const event = createMockEvent({
				isSuperAdmin: true,
				membership: null
			});

			const { db } = await import('$lib/server/db');
			const mockChain = {
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([{ draftSettings: { some: 'draft' } }])
			};
			(db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

			const result = await load(event);
			const data = getResultData(result);
			expect(data.hasDrafts).toBe(true);
		});
	});

	describe('authenticated user with valid membership', () => {
		it('should NOT redirect for role=owner', async () => {
			const event = createMockEvent({
				membership: {
					id: 'member-1',
					siteId: 'site-123',
					userId: 'user-1',
					role: 'owner',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			});

			const { db } = await import('$lib/server/db');
			const mockChain = {
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([{ draftSettings: null }])
			};
			(db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

			const result = await load(event);
			const data = getResultData(result);
			expect(data.isSuperAdmin).toBe(false);
			expect(data.membership).toBeDefined();
			expect((data.membership as Membership).role).toBe('owner');
		});

		it('should NOT redirect for role=admin', async () => {
			const event = createMockEvent({
				membership: {
					id: 'member-2',
					siteId: 'site-123',
					userId: 'user-2',
					role: 'admin',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			});

			const { db } = await import('$lib/server/db');
			const mockChain = {
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([{ draftSettings: null }])
			};
			(db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

			const result = await load(event);
			const data = getResultData(result);
			expect((data.membership as Membership).role).toBe('admin');
		});

		it('should NOT redirect for role=editor', async () => {
			const event = createMockEvent({
				membership: {
					id: 'member-3',
					siteId: 'site-123',
					userId: 'user-3',
					role: 'editor',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			});

			const { db } = await import('$lib/server/db');
			const mockChain = {
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([{ draftSettings: null }])
			};
			(db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

			const result = await load(event);
			const data = getResultData(result);
			expect((data.membership as Membership).role).toBe('editor');
		});
	});

	describe('authenticated user with no membership and not super admin', () => {
		it('should throw redirect to /login with error message', async () => {
			const event = createMockEvent({
				membership: null,
				isSuperAdmin: false
			});

			try {
				await load(event);
				expect.fail('Expected redirect to be thrown');
			} catch (e) {
				expect(e).toBeInstanceOf(Error);
				expect((e as Error).message).toContain('Redirect');
				expect((e as Error).message).toContain('/login');
				expect((e as Error).message).toContain('303');
				// URL-encoded message
				expect((e as Error).message).toContain('not%20a%20member');
			}
		});
	});

	describe('authenticated user with invalid role', () => {
		it('should throw redirect for an unknown/invalid role', async () => {
			const event = createMockEvent({
				membership: {
					id: 'member-4',
					siteId: 'site-123',
					userId: 'user-4',
					role: 'viewer' as unknown as 'owner',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			});

			try {
				await load(event);
				expect.fail('Expected redirect to be thrown');
			} catch (e) {
				expect(e).toBeInstanceOf(Error);
				expect((e as Error).message).toContain('Redirect');
				expect((e as Error).message).toContain('/login');
				expect((e as Error).message).toContain('303');
				expect((e as Error).message).toContain('permission');
			}
		});
	});

	describe('no site context', () => {
		it('should throw redirect when site is null', async () => {
			const event = createMockEvent({ site: null });

			try {
				await load(event);
				expect.fail('Expected redirect to be thrown');
			} catch (e) {
				expect(e).toBeInstanceOf(Error);
				expect((e as Error).message).toContain('Redirect');
				expect((e as Error).message).toContain('/login');
				// URL-encoded message
				expect((e as Error).message).toContain('No%20site%20context');
			}
		});
	});
});
