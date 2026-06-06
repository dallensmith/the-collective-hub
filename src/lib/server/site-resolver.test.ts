import { describe, it, expect, vi, beforeEach } from 'vitest';

// We import deepMerge directly from the source (it's now exported for testing).
// For getSiteBySlug, we mock the db module.
import { deepMerge, getSiteBySlug } from './site-resolver';

// Mock the database module
vi.mock('$lib/server/db', () => {
	const createQueryBuilder = () => {
		const builder: Record<string, unknown> = {
			_from: null as unknown,
			_where: null as unknown,
			_limitVal: null as unknown
		};

		const chain = {
			from: vi.fn().mockImplementation((table: unknown) => {
				builder._from = table;
				return chain;
			}),
			where: vi.fn().mockImplementation((condition: unknown) => {
				builder._where = condition;
				return chain;
			}),
			limit: vi.fn().mockImplementation((n: number) => {
				builder._limitVal = n;
				return chain;
			})
		};

		return chain;
	};

	const mockDb = {
		select: vi.fn().mockImplementation(() => {
			return createQueryBuilder();
		}),
		update: vi.fn(),
		insert: vi.fn(),
		delete: vi.fn()
	};

	return { db: mockDb };
});

// Mock $env/dynamic/private (needed by db/index.ts at import time)
vi.mock('$env/dynamic/private', () => ({
	env: {
		DATABASE_URL: 'postgresql://test:test@localhost:5432/test'
	}
}));

// Mock $app/environment (needed by db/index.ts at import time)
vi.mock('$app/environment', () => ({
	building: false,
	dev: true,
	browser: false
}));

describe('deepMerge', () => {
	it('merges nested objects correctly', () => {
		const target = { a: { b: 1, c: 2 }, d: 3 };
		const source = { a: { b: 10 } };
		const result = deepMerge(target, source);
		expect(result).toEqual({ a: { b: 10, c: 2 }, d: 3 });
	});

	it('source properties override target properties', () => {
		const target = { x: 1, y: 2 };
		const source = { x: 100 };
		const result = deepMerge(target, source);
		expect(result).toEqual({ x: 100, y: 2 });
	});

	it('handles null values by replacing', () => {
		const target = { a: { nested: true } };
		const source = { a: null };
		const result = deepMerge(target, source);
		expect(result).toEqual({ a: null });
	});

	it('replaces arrays rather than merging them', () => {
		const target = { items: [1, 2, 3] };
		const source = { items: [4, 5] };
		const result = deepMerge(target, source);
		expect(result).toEqual({ items: [4, 5] });
	});

	it('adds new keys from source', () => {
		const target = { a: 1 };
		const source = { b: 2 };
		const result = deepMerge(target, source);
		expect(result).toEqual({ a: 1, b: 2 });
	});

	it('does not mutate the original target', () => {
		const target = { a: { b: 1 } };
		const source = { a: { c: 2 } };
		const result = deepMerge(target, source);
		expect(target.a).toEqual({ b: 1 });
		expect(result.a).toEqual({ b: 1, c: 2 });
	});
});

describe('getSiteBySlug', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const mockSite = {
		id: 'site-123',
		slug: 'test-site',
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const mockSettings = {
		branding: { siteName: 'Test', tagline: 'A test site', logoCdnKey: null, backgroundCdnKey: null, faviconCdnKey: null },
		theme: { preset: 'dark' as const, accentColor: '#ff0000', backgroundColor: '#000000', textColor: '#ffffff' },
		homepage: { heroTitle: 'Hello', heroSubtitle: '', aboutText: '', primaryButtonText: '', primaryButtonLink: '', showNextEvent: false, showSchedule: false },
		layout: { preset: 'standard' as const }
	};

	it('returns a SiteContext with expected shape when site is found', async () => {
		const { db } = await import('$lib/server/db');
		
		// Mock the query chain to return our fake site + settings
		const mockChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn()
				.mockResolvedValueOnce([mockSite])   // first query: sites
				.mockResolvedValueOnce([{ settings: mockSettings, draftSettings: null }]) // second query: siteSettings
		};

		(db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

		const result = await getSiteBySlug('test-site');
		expect(result.site).toEqual(mockSite);
		expect(result.settings).toBeDefined();
		expect(result.settings.branding.siteName).toBe('Test');
	});

	it('throws when no site matches the slug', async () => {
		const { db } = await import('$lib/server/db');
		
		const mockChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValueOnce([]) // no site found
		};

		(db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

		await expect(getSiteBySlug('nonexistent')).rejects.toThrow('Site not found');
	});

	it('preview mode merges draftSettings on top of live settings', async () => {
		const { db } = await import('$lib/server/db');
		
		const draftSettings = {
			branding: { siteName: 'Draft Name' },
			theme: { accentColor: '#00ff00' }
		};

		const mockChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn()
				.mockResolvedValueOnce([mockSite])
				.mockResolvedValueOnce([{ settings: mockSettings, draftSettings }])
		};

		(db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

		const result = await getSiteBySlug('test-site', { preview: true });
		
		// Draft overrides should be merged
		expect(result.settings.branding.siteName).toBe('Draft Name');
		// Non-overridden values should remain from live
		expect(result.settings.theme.accentColor).toBe('#00ff00');
		// Untouched values should stay
		expect(result.settings.layout.preset).toBe('standard');
	});

	it('preview mode returns live settings when draftSettings is null', async () => {
		const { db } = await import('$lib/server/db');
		
		const mockChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn()
				.mockResolvedValueOnce([mockSite])
				.mockResolvedValueOnce([{ settings: mockSettings, draftSettings: null }])
		};

		(db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

		const result = await getSiteBySlug('test-site', { preview: true });
		expect(result.settings.branding.siteName).toBe('Test');
	});
});
