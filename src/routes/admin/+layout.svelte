<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { createAuthClient } from 'better-auth/svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const authClient = createAuthClient();

	/** Whether the mobile sidebar is open */
	let sidebarOpen = $state(false);

	/** Close sidebar on mobile when a nav link is clicked */
	function closeSidebar() {
		sidebarOpen = false;
	}

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = '/';
	}

	/** Enable preview mode: POST to /api/preview, then open public site in a new tab */
	async function enablePreview() {
		try {
			const res = await fetch('/api/preview', { method: 'POST' });
			if (res.ok) {
				window.open('/', '_blank');
			} else {
				const err = await res.json().catch(() => ({ error: 'Failed to enable preview.' }));
				alert(err.error ?? 'Failed to enable preview mode.');
			}
		} catch {
			alert('Network error enabling preview mode.');
		}
	}

	/** Discard all drafts after confirmation */
	async function handleDiscardDrafts() {
		if (!confirm('Discard all unpublished drafts? This cannot be undone.')) return;

		const currentPath = $page.url.pathname;
		// Submit to ?/discardDrafts on the current admin page
		const formData = new FormData();
		try {
			const res = await fetch(`${currentPath}?/discardDrafts`, {
				method: 'POST',
				body: formData
			});
			if (res.ok) {
				window.location.reload();
			} else {
				const err = await res.json().catch(() => ({ error: 'Failed to discard drafts.' }));
				alert(err.error ?? 'Failed to discard drafts.');
			}
		} catch {
			alert('Network error discarding drafts.');
		}
	}

	/** Whether the current page is a settings-related page (shows draft status bar) */
	let isSettingsPage = $derived(
		$page.url.pathname.startsWith('/admin/settings') ||
		$page.url.pathname.startsWith('/admin/branding') ||
		$page.url.pathname.startsWith('/admin/homepage')
	);

	/** Whether drafts exist */
	let hasDrafts = $derived((data as Record<string, unknown>).hasDrafts as boolean ?? false);

	/**
	 * Check if a nav path matches the current page.
	 * Dashboard ("/admin") only matches exactly; other paths match prefix.
	 */
	function isActive(href: string): boolean {
		const current = $page.url.pathname;
		if (href === '/admin') return current === '/admin';
		return current.startsWith(href);
	}

	interface NavItem {
		label: string;
		href: string;
		placeholder: boolean;
	}

	/** Feature flags from layout data (default: all enabled when unset) */
	let featureFlags = $derived((data as Record<string, unknown>).featureFlags as Record<string, boolean> | undefined ?? {});

	/** Whether a given feature is enabled (undefined = enabled for backward compat) */
	function flag(key: string): boolean {
		return featureFlags[key] !== false;
	}

	let navItems = $derived<NavItem[]>([
		{ label: 'Dashboard', href: '/admin', placeholder: false },
		{ label: 'Settings', href: '/admin/settings', placeholder: false },
		...(flag('branding') ? [{ label: 'Branding', href: '/admin/branding', placeholder: false }] : []),
		...(flag('homepageEditor') ? [{ label: 'Homepage', href: '/admin/homepage', placeholder: false }] : []),
		...(flag('navLinks') || flag('socialLinks') ? [{ label: 'Links', href: '/admin/links', placeholder: false }] : []),
		...(flag('events') ? [{ label: 'Events', href: '/admin/events', placeholder: false }] : []),
		...(flag('assetLibrary') ? [{ label: 'Assets', href: '/admin/assets', placeholder: false }] : []),
		...(data.isSuperAdmin ? [{ label: 'Super Admin', href: '/admin/super', placeholder: false }] : []),
		{ label: 'Team', href: '/admin/team', placeholder: false }
	]);
</script>

<svelte:head>
	<title>Admin — {data.site?.name ?? 'The Collective Hub'}</title>
</svelte:head>

<div class="admin-layout">
	<!-- Mobile overlay backdrop -->
	{#if sidebarOpen}
		<button class="sidebar-overlay" onclick={closeSidebar} aria-label="Close sidebar"></button>
	{/if}

	<!-- Left Sidebar -->
	<aside class="sidebar" class:sidebar--open={sidebarOpen}>
		<div class="sidebar-brand">
			<a href="/admin" class="sidebar-brand-link">
				<span class="sidebar-brand-icon">⚡</span>
				<span class="sidebar-brand-text">Admin</span>
			</a>
		</div>

		<nav class="sidebar-nav">
			<ul>
				{#each navItems as item}
					<li>
						{#if item.placeholder}
							<span class="nav-link nav-link--placeholder" title="Coming in a later phase">
								{item.label}
								<span class="placeholder-badge">soon</span>
							</span>
						{:else}
							<a
								href={item.href}
								class="nav-link"
								class:nav-link--active={isActive(item.href)}
								onclick={closeSidebar}
							>
								{item.label}
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</nav>

		<div class="sidebar-footer">
			<a href="/" class="back-link">← Back to Site</a>
			{#if data.isSuperAdmin}
				<a href="/admin/super" class="back-link super-admin-link" title="View All Sites">
					🌐 View All Sites
				</a>
			{/if}
		</div>
	</aside>

	<!-- Main area -->
	<div class="main-area">
		<!-- Top Bar -->
		<header class="top-bar">
			<!-- Hamburger (mobile only) -->
			<button
				class="hamburger"
				onclick={() => (sidebarOpen = !sidebarOpen)}
				aria-label="Toggle sidebar"
			>
				<span class="hamburger-bar"></span>
				<span class="hamburger-bar"></span>
				<span class="hamburger-bar"></span>
			</button>

			<span class="top-bar-site">{data.site?.name ?? 'Site'}</span>

			<div class="top-bar-right">
				{#if data.isSuperAdmin}
					<span class="super-admin-badge" title="Super Admin — full access to all sites">
						🛡️ Super Admin
					</span>
				{/if}
				{#if data.user}
					<div class="user-info">
						<img
							src={data.user.discordAvatarUrl}
							alt={data.user.discordUsername}
							class="user-avatar"
							width="32"
							height="32"
						/>
						<span class="user-name">{data.user.discordUsername}</span>
					</div>
				{/if}
				<button class="logout-btn" onclick={handleLogout}>Logout</button>
			</div>
		</header>

		<!-- Draft Status Bar (only on settings-related pages) -->
		{#if isSettingsPage}
			<div class="draft-bar">
				<div class="draft-bar-status">
					{#if hasDrafts}
						<span class="draft-indicator draft-indicator--pending">📝 Drafts pending — preview before publishing</span>
					{:else}
						<span class="draft-indicator draft-indicator--none">No unpublished changes</span>
					{/if}
				</div>
				<div class="draft-bar-actions">
					{#if hasDrafts}
						<button class="draft-btn draft-btn--preview" onclick={enablePreview}>
							🔍 Preview
						</button>
						<button class="draft-btn draft-btn--discard" onclick={handleDiscardDrafts}>
							🗑️ Discard Drafts
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Content Area -->
		<main class="content">
			{@render children()}
		</main>
	</div>
</div>

<style>
	/* ── Reset & Base ───────────────────────────────────────────── */
	.admin-layout {
		display: flex;
		min-height: 100vh;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f5f5f7;
		color: #1a1a2e;
	}

	/* ── Sidebar ────────────────────────────────────────────────── */
	.sidebar {
		width: 240px;
		min-width: 240px;
		background: #161b22;
		color: #c9d1d9;
		display: flex;
		flex-direction: column;
		border-right: 1px solid #30363d;
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 30;
		transition: transform 0.25s ease;
	}

	.sidebar-brand {
		padding: 1.25rem 1.25rem 1rem;
		border-bottom: 1px solid #21262d;
	}

	.sidebar-brand-link {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		text-decoration: none;
		color: #f0f6fc;
		font-weight: 700;
		font-size: 1.1rem;
		letter-spacing: 0.02em;
	}

	.sidebar-brand-icon {
		font-size: 1.3rem;
	}

	.sidebar-nav {
		flex: 1;
		padding: 0.75rem 0;
		overflow-y: auto;
	}

	.sidebar-nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.sidebar-nav li {
		margin: 0;
	}

	.nav-link {
		display: block;
		padding: 0.625rem 1.5rem;
		color: #8b949e;
		text-decoration: none;
		font-size: 0.925rem;
		font-weight: 500;
		transition: background 0.15s, color 0.15s;
		border-left: 3px solid transparent;
	}

	.nav-link:hover {
		background: #1c2129;
		color: #f0f6fc;
	}

	.nav-link--active {
		background: #1c2129;
		color: #f0f6fc;
		border-left-color: #58a6ff;
	}

	/* Placeholder nav items */
	.nav-link--placeholder {
		cursor: not-allowed;
		opacity: 0.5;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-link--placeholder:hover {
		background: transparent;
		color: #8b949e;
	}

	.placeholder-badge {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: #30363d;
		color: #8b949e;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}

	.sidebar-footer {
		padding: 0.75rem 1.25rem;
		border-top: 1px solid #21262d;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.back-link {
		color: #8b949e;
		text-decoration: none;
		font-size: 0.85rem;
		transition: color 0.15s;
	}

	.back-link:hover {
		color: #f0f6fc;
	}

	.super-admin-link {
		font-size: 0.8rem;
		color: #58a6ff;
	}

	.super-admin-link:hover {
		color: #79b8ff;
	}

	/* ── Main Area ──────────────────────────────────────────────── */
	.main-area {
		flex: 1;
		margin-left: 240px;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	/* ── Top Bar ────────────────────────────────────────────────── */
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.5rem;
		background: #ffffff;
		border-bottom: 1px solid #e0e0e6;
		position: sticky;
		top: 0;
		z-index: 20;
	}

	.hamburger {
		display: none;
		flex-direction: column;
		gap: 4px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
	}

	.hamburger-bar {
		display: block;
		width: 22px;
		height: 2px;
		background: #1a1a2e;
		border-radius: 1px;
	}

	.top-bar-site {
		font-weight: 600;
		font-size: 0.95rem;
		color: #555;
	}

	.top-bar-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* Super Admin Badge */
	.super-admin-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.6rem;
		border-radius: 4px;
		background: #fde8e8;
		color: #9b1c1c;
		border: 1px solid #f4b2b2;
		white-space: nowrap;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid #e0e0e6;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1a1a2e;
	}

	.logout-btn {
		padding: 0.4rem 0.9rem;
		font-size: 0.8rem;
		font-weight: 500;
		color: #e5534b;
		background: transparent;
		border: 1px solid #e5534b;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.logout-btn:hover {
		background: #e5534b;
		color: #fff;
	}

	/* ── Draft Status Bar ──────────────────────────────────────── */
	.draft-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 1.5rem;
		background: #fff8e1;
		border-bottom: 1px solid #ffe082;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.draft-bar-status {
		font-size: 0.85rem;
		font-weight: 500;
	}

	.draft-indicator--pending {
		color: #e65100;
	}

	.draft-indicator--none {
		color: #888;
	}

	.draft-bar-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.draft-btn {
		padding: 0.35rem 0.8rem;
		font-size: 0.8rem;
		font-weight: 600;
		border-radius: 5px;
		border: none;
		cursor: pointer;
		transition: background 0.15s, opacity 0.15s;
	}

	.draft-btn--preview {
		background: #1a1a2e;
		color: #fff;
	}

	.draft-btn--preview:hover {
		background: #333;
	}

	.draft-btn--discard {
		background: transparent;
		color: #e5534b;
		border: 1px solid #e5534b;
	}

	.draft-btn--discard:hover {
		background: #fde8e8;
	}

	/* ── Content Area ───────────────────────────────────────────── */
	.content {
		flex: 1;
		padding: 2rem;
		max-width: 960px;
	}

	/* ── Mobile Overlay ─────────────────────────────────────────── */
	.sidebar-overlay {
		display: none;
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 25;
		border: none;
		cursor: pointer;
	}

	/* ── Responsive ─────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.sidebar {
			transform: translateX(-100%);
		}

		.sidebar--open {
			transform: translateX(0);
		}

		.sidebar-overlay {
			display: block;
		}

		.main-area {
			margin-left: 0;
		}

		.hamburger {
			display: flex;
		}

		.content {
			padding: 1.25rem;
		}

		.user-name {
			display: none;
		}

		.super-admin-badge {
			font-size: 0.65rem;
			padding: 0.15rem 0.4rem;
		}
	}
</style>
