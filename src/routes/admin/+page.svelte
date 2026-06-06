<script lang="ts">
	import type { PageData } from './$types';
	import { env } from '$env/dynamic/public';

	let { data }: { data: PageData } = $props();

	/** Today's date formatted */
	let today = $state(
		new Date().toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		})
	);

	/** Stats from the page server load */
	let stats = $derived(data.stats ?? {
		totalEvents: 0,
		publishedEvents: 0,
		upcomingEvents: 0,
		totalAssets: 0,
		totalNavLinks: 0,
		totalSocialLinks: 0,
		totalMembers: 0,
		hasSettings: false
	});

	let siteUrl = $derived(data.siteUrl ?? env.PUBLIC_SITE_URL ?? null);
	let siteName = $derived(data.site?.name ?? 'Your Site');
	let username = $derived(data.user?.discordUsername ?? 'there');
	let currentRole = $derived(data.currentUserRole ?? data.membership?.role ?? null);
	let isActive = $derived(data.isActive ?? true);

	/**
	 * Feature flags from the page server (also available via layout data).
	 * Undefined flags default to enabled for backward compatibility.
	 */
	let featureFlags = $derived(
		(data.featureFlags as Record<string, boolean> | undefined) ??
		(data as Record<string, unknown>).featureFlags as Record<string, boolean> | undefined ??
		{}
	);

	/** Whether a given feature is enabled (undefined = enabled for backward compat) */
	function flag(key: string): boolean {
		return featureFlags[key] !== false;
	}

	/** Total links (nav + social) */
	let totalLinks = $derived(stats.totalNavLinks + stats.totalSocialLinks);

	/** Recent activity from audit log */
	let recentActivity = $derived(data.recentActivity ?? []);

	/** Format a timestamp for display */
	function formatTime(ts: string | Date): string {
		const d = typeof ts === 'string' ? new Date(ts) : ts;
		return d.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	/** Human-readable action label */
	function actionLabel(action: string): string {
		switch (action) {
			case 'create': return 'Created';
			case 'update': return 'Updated';
			case 'delete': return 'Deleted';
			default: return action;
		}
	}

	/** Entity type label */
	function entityLabel(entityType: string): string {
		switch (entityType) {
			case 'event': return 'event';
			case 'asset': return 'asset';
			case 'link': return 'link';
			case 'branding': return 'branding';
			case 'homepage': return 'homepage';
			case 'settings': return 'settings';
			case 'team': return 'team member';
			case 'site': return 'site';
			default: return entityType;
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard — {siteName}</title>
</svelte:head>

<div class="dashboard">
	<!-- Welcome Banner -->
	<div class="welcome-banner">
		<div class="welcome-text">
			<h2>Welcome back, {username}</h2>
			<p class="welcome-date">{today}</p>
		</div>
		{#if currentRole}
			<span class="role-pill">
				{currentRole === 'owner' ? '👑' : currentRole === 'admin' ? '🛡️' : '✏️'}
				{currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
			</span>
		{/if}
	</div>

	<!-- Status Card -->
	{#if siteUrl}
		<div class="status-card status-card--live">
			<span class="status-indicator status-indicator--active"></span>
			<span class="status-text">
				Your site is live at{' '}
				<a href={siteUrl} target="_blank" rel="noopener noreferrer" class="status-link">
					{siteUrl}
				</a>
			</span>
			<a href={siteUrl} target="_blank" rel="noopener noreferrer" class="view-site-link">
				View Site ↗
			</a>
		</div>
	{:else if !isActive}
		<div class="status-card status-card--inactive">
			<span class="status-indicator status-indicator--inactive"></span>
			<span class="status-text">This site is currently deactivated.</span>
		</div>
	{:else if isActive && !siteUrl}
		<div class="status-card status-card--warning">
			<span class="status-indicator status-indicator--warning"></span>
			<span class="status-text">⚠️ PUBLIC_SITE_URL not configured. Set it in your environment variables.</span>
		</div>
	{/if}

	<!-- Quick Stats Grid -->
	<div class="stats-section">
		<h3 class="section-title">Overview</h3>
		<div class="stats-grid">
			<div class="stat-card">
				<span class="stat-icon">📅</span>
				<div class="stat-body">
					<span class="stat-number">{stats.totalEvents}</span>
					<span class="stat-label">Events</span>
					<span class="stat-detail">
						{stats.totalEvents} total{stats.publishedEvents > 0 ? `, ${stats.publishedEvents} published` : ''}{stats.upcomingEvents > 0 ? `, ${stats.upcomingEvents} upcoming` : ''}
					</span>
				</div>
			</div>

			<div class="stat-card">
				<span class="stat-icon">🖼️</span>
				<div class="stat-body">
					<span class="stat-number">{stats.totalAssets}</span>
					<span class="stat-label">Assets</span>
					<span class="stat-detail">
						{stats.totalAssets === 1 ? '1 file' : `${stats.totalAssets} files`}
					</span>
				</div>
			</div>

			<div class="stat-card">
				<span class="stat-icon">🔗</span>
				<div class="stat-body">
					<span class="stat-number">{totalLinks}</span>
					<span class="stat-label">Links</span>
					<span class="stat-detail">
						{stats.totalNavLinks} nav + {stats.totalSocialLinks} social
					</span>
				</div>
			</div>

			<div class="stat-card">
				<span class="stat-icon">👥</span>
				<div class="stat-body">
					<span class="stat-number">{stats.totalMembers}</span>
					<span class="stat-label">Team</span>
					<span class="stat-detail">
						{stats.totalMembers === 1 ? '1 member' : `${stats.totalMembers} members`}
					</span>
				</div>
			</div>

			<div class="stat-card">
				<span class="stat-icon">⚙️</span>
				<div class="stat-body">
					{#if stats.hasSettings}
						<span class="stat-check">✓</span>
						<span class="stat-label">Settings</span>
						<span class="stat-detail">Configured</span>
					{:else}
						<span class="stat-number">—</span>
						<span class="stat-label">Settings</span>
						<span class="stat-detail stat-detail--warn">
							<a href="/admin/settings" class="inline-link">Not yet configured</a>
						</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="actions-section">
		<h3 class="section-title">Quick Actions</h3>
		<div class="actions-grid">
			{#if flag('homepageEditor')}
				<a href="/admin/homepage" class="action-card">
					<span class="action-icon">🏠</span>
					<span class="action-label">Edit Homepage</span>
					<span class="action-desc">Customize your hero section and content</span>
				</a>
			{/if}
			{#if flag('events')}
				<a href="/admin/events" class="action-card">
					<span class="action-icon">📅</span>
					<span class="action-label">Manage Events</span>
					<span class="action-desc">Create and schedule upcoming events</span>
				</a>
			{/if}
			{#if flag('assetLibrary')}
				<a href="/admin/assets" class="action-card">
					<span class="action-icon">📁</span>
					<span class="action-label">Upload Assets</span>
					<span class="action-desc">Upload images, files, and media</span>
				</a>
			{/if}
			{#if flag('branding')}
				<a href="/admin/branding" class="action-card">
					<span class="action-icon">🎨</span>
					<span class="action-label">Customize Branding</span>
					<span class="action-desc">Set your logo, colors, and theme</span>
				</a>
			{/if}
			{#if flag('navLinks') || flag('socialLinks')}
				<a href="/admin/links" class="action-card">
					<span class="action-icon">🔗</span>
					<span class="action-label">Manage Links</span>
					<span class="action-desc">Edit navigation and social links</span>
				</a>
			{/if}
			<a href="/admin/team" class="action-card">
				<span class="action-icon">👥</span>
				<span class="action-label">Manage Team</span>
				<span class="action-desc">Add or remove site members</span>
			</a>
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="activity-section">
		<h3 class="section-title">Recent Activity</h3>
		{#if recentActivity.length > 0}
			<div class="activity-list">
				{#each recentActivity as entry}
					<div class="activity-item">
						<span class="activity-icon">
							{entry.action === 'create' ? '➕' : entry.action === 'delete' ? '🗑️' : '✏️'}
						</span>
						<span class="activity-body">
							<strong>{actionLabel(entry.action)}</strong> {entityLabel(entry.entityType)}
							{#if entry.userEmail}
								<span class="activity-user">by {entry.userEmail}</span>
							{/if}
						</span>
						<span class="activity-time">{formatTime(entry.createdAt)}</span>
					</div>
				{/each}
			</div>
		{:else}
			<div class="activity-placeholder">
				<p>📋 No recent activity.</p>
			</div>
		{/if}
		<div class="activity-footer">
			<a href="/admin/audit-log" class="view-all-link">View all →</a>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 900px;
	}

	/* ── Welcome Banner ──────────────────────────────────────────── */
	.welcome-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		padding: 1.25rem;
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
	}

	.welcome-text h2 {
		margin: 0 0 0.25rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.welcome-date {
		margin: 0;
		font-size: 0.85rem;
		color: #888;
	}

	.role-pill {
		display: inline-block;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0.25rem 0.65rem;
		border-radius: 20px;
		background: #f0f0f3;
		color: #555;
		border: 1px solid #d0d0d6;
	}

	/* ── Status Card ─────────────────────────────────────────────── */
	.status-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
		flex-wrap: wrap;
	}

	.status-card--live {
		background: #daf5e0;
		border: 1px solid #a3d9b1;
		color: #1a6b30;
	}

	.status-card--inactive {
		background: #fef3c7;
		border: 1px solid #fcd34d;
		color: #92400e;
	}

	.status-card--warning {
		background: #fef3c7;
		border: 1px solid #fcd34d;
		color: #92400e;
	}

	.status-indicator {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-indicator--active {
		background: #1a7f37;
		box-shadow: 0 0 0 3px rgba(26, 127, 55, 0.2);
	}

	.status-indicator--inactive {
		background: #92400e;
	}

	.status-indicator--warning {
		background: #f59e0b;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
	}

	.status-text {
		flex: 1;
		min-width: 0;
	}

	.status-link {
		color: #1a6b30;
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.status-link:hover {
		color: #14682c;
	}

	.view-site-link {
		color: #1a6b30;
		font-weight: 600;
		font-size: 0.825rem;
		text-decoration: none;
		padding: 0.3rem 0.65rem;
		border: 1px solid #1a7f37;
		border-radius: 5px;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.view-site-link:hover {
		background: #1a7f37;
		color: #fff;
	}

	/* ── Section Title ───────────────────────────────────────────── */
	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: #1a1a2e;
		margin: 0 0 0.75rem;
	}

	/* ── Stats Grid ──────────────────────────────────────────────── */
	.stats-section {
		margin-bottom: 1.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 0.75rem;
	}

	.stat-card {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
		transition: border-color 0.15s;
	}

	.stat-card:hover {
		border-color: #d0d0d6;
	}

	.stat-icon {
		font-size: 1.4rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.stat-body {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.stat-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a2e;
		line-height: 1;
	}

	.stat-check {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a7f37;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #888;
	}

	.stat-detail {
		font-size: 0.75rem;
		color: #999;
	}

	.stat-detail--warn {
		color: #92400e;
	}

	.inline-link {
		color: #92400e;
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.inline-link:hover {
		color: #78350f;
	}

	/* ── Quick Actions Grid ──────────────────────────────────────── */
	.actions-section {
		margin-bottom: 1.5rem;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.action-card {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 1rem 1.125rem;
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
		text-decoration: none;
		color: #1a1a2e;
		transition: border-color 0.15s, background 0.15s;
	}

	.action-card:hover {
		border-color: #58a6ff;
		background: #f8faff;
	}

	.action-icon {
		font-size: 1.3rem;
		line-height: 1;
	}

	.action-label {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.action-desc {
		font-size: 0.775rem;
		color: #888;
		line-height: 1.35;
	}

	/* ── Activity Section ────────────────────────────────────────── */
	.activity-section {
		margin-bottom: 1.5rem;
	}

	.activity-list {
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
		overflow: hidden;
	}

	.activity-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f0f0f3;
		font-size: 0.85rem;
	}

	.activity-item:last-child {
		border-bottom: none;
	}

	.activity-icon {
		flex-shrink: 0;
		font-size: 1rem;
	}

	.activity-body {
		flex: 1;
		min-width: 0;
	}

	.activity-user {
		color: #888;
		font-size: 0.8rem;
	}

	.activity-time {
		flex-shrink: 0;
		color: #aaa;
		font-size: 0.775rem;
		white-space: nowrap;
	}

	.activity-placeholder {
		padding: 1.25rem;
		background: #fff;
		border: 1px dashed #d0d0d6;
		border-radius: 8px;
		text-align: center;
	}

	.activity-placeholder p {
		margin: 0;
		font-size: 0.875rem;
		color: #999;
	}

	.activity-footer {
		margin-top: 0.5rem;
		text-align: right;
	}

	.view-all-link {
		font-size: 0.825rem;
		color: #58a6ff;
		text-decoration: none;
		font-weight: 500;
	}

	.view-all-link:hover {
		text-decoration: underline;
	}

	/* ── Responsive ──────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		}

		.actions-grid {
			grid-template-columns: 1fr;
		}

		.welcome-banner {
			flex-direction: column;
			align-items: flex-start;
		}

		.stat-number {
			font-size: 1.25rem;
		}
	}

	@media (max-width: 480px) {
		.stats-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
