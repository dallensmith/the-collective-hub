<script lang="ts">
	import type { PageData } from './$types';
	import { formatEventTime, formatEventDate, formatEventTimeOnly } from '$lib/shared/timezone';

	let { data }: { data: PageData } = $props();

	/** Whether the mobile nav menu is open */
	let navOpen = $state(false);

	/**
	 * Determine if a link is external (starts with http:// or https://).
	 * Internal links (starting with `/`) navigate normally.
	 */
	function isExternal(href: string): boolean {
		return /^https?:\/\//.test(href);
	}

	/** Close mobile nav when a link is clicked */
	function closeNav() {
		navOpen = false;
	}

	/**
	 * Truncate text to a maximum length, appending "..." if truncated.
	 */
	function truncate(text: string | null | undefined, maxLen: number): string {
		if (!text) return '';
		if (text.length <= maxLen) return text;
		return text.slice(0, maxLen).trimEnd() + '...';
	}

	/** Get a human-readable label for event type */
	function eventTypeLabel(type: string): string {
		const map: Record<string, string> = {
			screening: 'Screening',
			watch_party: 'Watch Party',
			meetup: 'Meetup',
			other: 'Other'
		};
		return map[type] ?? type;
	}

	/** Get CSS class for event type badge */
	function eventTypeBadgeClass(type: string): string {
		return `event-type-badge event-type-badge--${type}`;
	}
</script>

<svelte:head>
	<title>{data.heroTitle}</title>
	{#if data.faviconUrl}
		<link rel="icon" href={data.faviconUrl} />
	{/if}
</svelte:head>

<!-- Error state: no site configured -->
{#if !data.site}
	<main class="error-state">
		<h1>Site not configured</h1>
		<p>Check the <code>SITE_SLUG</code> environment variable and ensure a matching row exists in the sites table.</p>
		<p>Run <code>npm run db:seed</code> to create the default "local-dev" site.</p>
	</main>
{:else}
	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- NAV BAR -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	<nav class="navbar">
		<div class="navbar-inner">
			<!-- Logo / Site Name -->
			<a href="/" class="navbar-brand">
				{#if data.logoUrl}
					<img
						src={data.logoUrl}
						alt={data.site.name}
						class="navbar-logo"
						width="32"
						height="32"
					/>
				{/if}
				<span class="navbar-name">{data.site.name}</span>
			</a>

			<!-- Nav Links (header position only) -->
			{#if data.navLinks && data.navLinks.length > 0}
				<div class="navbar-links" class:navbar-links--open={navOpen}>
					{#each data.navLinks.filter((l) => l.position === 'header') as link}
						{@const external = isExternal(link.url)}
						<a
							href={link.url}
							class="navbar-link"
							target={external ? '_blank' : undefined}
							rel={external ? 'noopener noreferrer' : undefined}
							onclick={closeNav}
						>
							{link.label}
							{#if external}
								<span class="external-icon">↗</span>
							{/if}
						</a>
					{/each}
				</div>
			{/if}

			<!-- Hamburger (mobile) -->
			{#if data.navLinks && data.navLinks.length > 0}
				<button
					class="navbar-toggle"
					onclick={() => (navOpen = !navOpen)}
					aria-label="Toggle navigation"
					aria-expanded={navOpen}
				>
					<span class="navbar-toggle-bar"></span>
					<span class="navbar-toggle-bar"></span>
					<span class="navbar-toggle-bar"></span>
				</button>
			{/if}
		</div>
	</nav>

	<!-- Mobile nav overlay -->
	{#if navOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="nav-overlay" onclick={closeNav}></div>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- HERO SECTION -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	<section
		class="hero"
		style={data.backgroundUrl
			? `background-image: url(${data.backgroundUrl}); background-size: cover; background-position: center;`
			: ''}
	>
		<div class="hero-content">
			{#if data.logoUrl}
				<img
					src={data.logoUrl}
					alt={data.heroTitle}
					class="hero-logo"
					width="120"
					height="120"
				/>
			{/if}
			<h1>{data.heroTitle}</h1>

			{#if data.heroSubtitle}
				<p class="hero-subtitle">{data.heroSubtitle}</p>
			{/if}

			{#if data.ctaText && data.ctaLink}
				{@const external = isExternal(data.ctaLink)}
				<a
					class="cta-button"
					href={data.ctaLink}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener noreferrer' : undefined}
				>
					{data.ctaText}
				</a>
			{/if}
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- ABOUT SECTION (only if aboutText is set) -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	{#if data.aboutText}
		<section class="about">
			<div class="about-content">
				<h2>About</h2>
				<p>{data.aboutText}</p>
			</div>
		</section>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- NEXT EVENT SECTION (only if showNextEvent is true AND nextEvent exists) -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	{#if data.showNextEvent && data.nextEvent}
		<section class="next-event-section">
			<div class="next-event-content">
				<h2 class="section-heading">Next Event</h2>

				<div class="next-event-card">
					<div class="next-event-body">
						<h3 class="next-event-title">{data.nextEvent.title}</h3>

						<div class="next-event-meta">
							<span class="next-event-datetime">
								📅 {formatEventTime(data.nextEvent.startTime)}
							</span>

							{#if data.nextEvent.endTime}
								<span class="next-event-datetime next-event-end">
									→ {formatEventTimeOnly(data.nextEvent.endTime)}
								</span>
							{/if}

							<span class={eventTypeBadgeClass(data.nextEvent.eventType)}>
								{eventTypeLabel(data.nextEvent.eventType)}
							</span>
						</div>

						{#if data.nextEvent.description}
							<p class="next-event-desc">
								{truncate(data.nextEvent.description, 150)}
							</p>
						{/if}

						{#if data.nextEvent.location}
							<p class="next-event-location">
								📍 {data.nextEvent.location}
							</p>
						{/if}
					</div>

					{#if data.nextEvent.externalLink}
						<div class="next-event-action">
							<a
								href={data.nextEvent.externalLink}
								class="event-details-link"
								target="_blank"
								rel="noopener noreferrer"
							>
								Event Details ↗
							</a>
						</div>
					{/if}
				</div>
			</div>
		</section>
	{:else if data.showNextEvent && !data.nextEvent}
		<section class="next-event-section">
			<div class="next-event-content">
				<h2 class="section-heading">Next Event</h2>
				<p class="no-events-message">No upcoming events — check back soon!</p>
			</div>
		</section>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- UPCOMING EVENTS SECTION (only if showSchedule is true AND upcomingEvents has items) -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	{#if data.showSchedule && data.upcomingEvents && data.upcomingEvents.length > 0}
		{@const displayEvents = data.nextEvent
			? data.upcomingEvents.filter((e) => e.id !== data.nextEvent!.id).slice(0, 5)
			: data.upcomingEvents.slice(0, 5)}

		{#if displayEvents.length > 0}
			<section class="upcoming-events-section">
				<div class="upcoming-events-content">
					<h2 class="section-heading">Upcoming Events</h2>

					<div class="upcoming-events-list">
						{#each displayEvents as evt}
							<div class="upcoming-event-row">
								<span class="upcoming-event-date">
									{formatEventDate(evt.startTime)}
								</span>
								<span class="upcoming-event-title">{evt.title}</span>
								<span class={eventTypeBadgeClass(evt.eventType)}>
									{eventTypeLabel(evt.eventType)}
								</span>
								{#if evt.startTime}
									<span class="upcoming-event-time">
										{formatEventTimeOnly(evt.startTime)}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</section>
		{/if}
	{/if}

	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- SOCIAL LINKS SECTION (only if socialLinks has items) -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	{#if data.socialLinks && data.socialLinks.length > 0}
		<section class="social-links-section">
			<div class="social-links-content">
				<h2 class="social-links-heading">Connect With Us</h2>
				<div class="social-links-row">
					{#each data.socialLinks as link}
						{@const external = isExternal(link.url)}
						<a
							href={link.url}
							class="social-link"
							target={external ? '_blank' : undefined}
							rel={external ? 'noopener noreferrer' : undefined}
							title={link.label || link.platform}
						>
							<span class="social-link-icon">{link.platform}</span>
							{#if link.label}
								<span class="social-link-label">{link.label}</span>
							{/if}
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════ -->
	<!-- FOOTER -->
	<!-- ═══════════════════════════════════════════════════════════ -->
	<footer class="footer">
		<div class="footer-content">
			<span class="footer-site-name">{data.site.name}</span>
			<span class="footer-powered">Powered by The Collective Hub</span>
			{#if data.user && data.membership}
				<a class="footer-admin-link" href="/admin">Manage Site</a>
			{/if}
		</div>
	</footer>
{/if}

<style>
	/* ═══════════════════════════════════════════════════════════ */
	/* Nav Bar */
	/* ═══════════════════════════════════════════════════════════ */
	.navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--color-background, #1a1a2e);
		border-bottom: 1px solid rgba(176, 176, 176, 0.15);
		backdrop-filter: blur(8px);
	}

	.navbar-inner {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 56px;
		gap: 1rem;
	}

	.navbar-brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: var(--color-text, #eaeaea);
		font-weight: 700;
		font-size: 1.05rem;
		flex-shrink: 0;
	}

	.navbar-brand:hover {
		opacity: 0.85;
	}

	.navbar-logo {
		border-radius: 4px;
		object-fit: contain;
	}

	.navbar-links {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.navbar-link {
		padding: 0.45rem 0.8rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-secondary, #b0b0b0);
		text-decoration: none;
		border-radius: 6px;
		transition: color 0.15s, background 0.15s;
		white-space: nowrap;
	}

	.navbar-link:hover {
		color: var(--color-text, #eaeaea);
		background: rgba(255, 255, 255, 0.06);
	}

	.external-icon {
		font-size: 0.75rem;
		margin-left: 0.15rem;
		opacity: 0.6;
	}

	/* Hamburger */
	.navbar-toggle {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 6px;
	}

	.navbar-toggle-bar {
		display: block;
		width: 24px;
		height: 2px;
		background: var(--color-text, #eaeaea);
		border-radius: 1px;
		transition: transform 0.2s, opacity 0.2s;
	}

	/* Mobile nav overlay */
	.nav-overlay {
		display: none;
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 40;
	}

	/* ═══════════════════════════════════════════════════════════ */
	/* Social Links Section */
	/* ═══════════════════════════════════════════════════════════ */
	.social-links-section {
		padding: 3rem 2rem;
		display: flex;
		justify-content: center;
		border-top: 1px solid rgba(176, 176, 176, 0.1);
	}

	.social-links-content {
		max-width: 720px;
		width: 100%;
		text-align: center;
	}

	.social-links-heading {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text, #eaeaea);
		margin: 0 0 1.25rem;
	}

	.social-links-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
	}

	.social-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-secondary, #b0b0b0);
		text-decoration: none;
		border: 1px solid rgba(176, 176, 176, 0.2);
		border-radius: 8px;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
	}

	.social-link:hover {
		color: var(--color-accent, #e63946);
		border-color: var(--color-accent, #e63946);
		background: rgba(255, 255, 255, 0.03);
	}

	.social-link-icon {
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.social-link-label {
		font-size: 0.85rem;
	}

	/* ── Responsive Nav ────────────────────────────────────────── */
	@media (max-width: 768px) {
		.navbar-toggle {
			display: flex;
		}

		.navbar-links {
			display: none;
			position: absolute;
			top: 56px;
			left: 0;
			right: 0;
			background: var(--color-background, #1a1a2e);
			flex-direction: column;
			padding: 0.75rem 1.5rem;
			border-bottom: 1px solid rgba(176, 176, 176, 0.15);
			z-index: 45;
			gap: 0.25rem;
		}

		.navbar-links--open {
			display: flex;
		}

		.navbar-link {
			padding: 0.6rem 0.75rem;
			width: 100%;
		}

		.nav-overlay {
			display: block;
		}

		.navbar-name {
			display: none;
		}

		.social-links-section {
			padding: 2rem 1.25rem;
		}
	}

	/* Error State */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
		padding: 2rem;
	}

	.error-state h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
		color: var(--color-accent);
	}

	.error-state p {
		color: var(--color-text-secondary);
		max-width: 60ch;
		line-height: 1.6;
	}

	.error-state code {
		background: rgba(255, 255, 255, 0.1);
		padding: 0.15em 0.4em;
		border-radius: 4px;
		font-size: 0.9em;
	}

	/* Hero Section */
	.hero {
		min-height: 60vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(
			135deg,
			var(--color-background) 0%,
			color-mix(in srgb, var(--color-background) 85%, black) 100%
		);
		padding: 2rem;
		position: relative;
	}

	/* Gradient overlay: always present; when a background image is set
	   the overlay dims it so text remains readable */
	.hero::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			var(--color-background) 0%,
			color-mix(in srgb, var(--color-background) 85%, black) 100%
		);
		z-index: 1;
	}

	.hero[style*="background-image"]::before {
		opacity: 0.6;
	}

	.hero-content {
		text-align: center;
		max-width: 720px;
		position: relative;
		z-index: 2;
	}

	.hero-logo {
		display: block;
		margin: 0 auto 1.5rem;
		border-radius: 12px;
		object-fit: contain;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.25));
	}

	.hero-content h1 {
		font-size: 3rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.75rem 0;
		line-height: 1.15;
		letter-spacing: -0.02em;
	}

	.hero-subtitle {
		font-size: 1.25rem;
		color: var(--color-text-secondary);
		margin: 0 0 2rem 0;
		line-height: 1.5;
	}

	.cta-button {
		display: inline-block;
		background: var(--color-accent);
		color: #fff;
		padding: 0.85rem 2rem;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 600;
		text-decoration: none;
		transition: opacity 0.15s ease, transform 0.15s ease;
	}

	.cta-button:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.cta-button:active {
		transform: translateY(0);
	}

	/* Next Event Section */
	.next-event-section {
		padding: 3rem 2rem;
		display: flex;
		justify-content: center;
		border-top: 1px solid rgba(176, 176, 176, 0.1);
	}

	.next-event-content {
		max-width: 720px;
		width: 100%;
	}

	.section-heading {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text, #eaeaea);
		margin: 0 0 1.5rem;
	}

	.next-event-card {
		background: var(--color-card-background, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(176, 176, 176, 0.2));
		border-radius: 12px;
		padding: 1.75rem;
		transition: border-color 0.2s;
	}

	.next-event-card:hover {
		border-color: var(--color-accent, #e63946);
	}

	.next-event-body {
		margin-bottom: 1rem;
	}

	.next-event-title {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--color-text, #eaeaea);
		margin: 0 0 0.75rem;
	}

	.next-event-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.next-event-datetime {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #b0b0b0);
		font-weight: 500;
	}

	.next-event-end {
		opacity: 0.75;
	}

	.event-type-badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.2rem 0.55rem;
		border-radius: 4px;
	}

	.event-type-badge--screening {
		background: rgba(59, 130, 246, 0.2);
		color: #60a5fa;
	}

	.event-type-badge--watch_party {
		background: rgba(139, 92, 246, 0.2);
		color: #a78bfa;
	}

	.event-type-badge--meetup {
		background: rgba(245, 158, 11, 0.2);
		color: #fbbf24;
	}

	.event-type-badge--other {
		background: rgba(156, 163, 175, 0.2);
		color: #d1d5db;
	}

	.next-event-desc {
		font-size: 0.95rem;
		color: var(--color-text-secondary, #b0b0b0);
		line-height: 1.6;
		margin: 0 0 0.5rem;
	}

	.next-event-location {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #b0b0b0);
		margin: 0;
	}

	.next-event-action {
		border-top: 1px solid rgba(176, 176, 176, 0.1);
		padding-top: 1rem;
	}

	.event-details-link {
		display: inline-block;
		padding: 0.55rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #fff;
		background: var(--color-accent, #e63946);
		border-radius: 6px;
		text-decoration: none;
		transition: opacity 0.15s, transform 0.15s;
	}

	.event-details-link:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.no-events-message {
		color: var(--color-text-secondary, #b0b0b0);
		font-size: 0.95rem;
		font-style: italic;
		margin: 0;
	}

	/* Upcoming Events Section */
	.upcoming-events-section {
		padding: 3rem 2rem;
		display: flex;
		justify-content: center;
		border-top: 1px solid rgba(176, 176, 176, 0.1);
	}

	.upcoming-events-content {
		max-width: 720px;
		width: 100%;
	}

	.upcoming-events-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.upcoming-event-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.7rem 1rem;
		background: var(--color-card-background, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(176, 176, 176, 0.15));
		border-radius: 8px;
		transition: border-color 0.15s;
	}

	.upcoming-event-row:hover {
		border-color: var(--color-accent, #e63946);
	}

	.upcoming-event-date {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text, #eaeaea);
		white-space: nowrap;
		min-width: 7em;
	}

	.upcoming-event-title {
		flex: 1;
		font-size: 0.925rem;
		font-weight: 500;
		color: var(--color-text, #eaeaea);
	}

	.upcoming-event-time {
		font-size: 0.8rem;
		color: var(--color-text-secondary, #b0b0b0);
		white-space: nowrap;
	}

	/* About Section */
	.about {
		padding: 4rem 2rem;
		display: flex;
		justify-content: center;
	}

	.about-content {
		max-width: 65ch;
		width: 100%;
	}

	.about-content h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 1rem 0;
	}

	.about-content p {
		color: var(--color-text-secondary);
		line-height: 1.7;
		margin: 0;
		font-size: 1.05rem;
	}

	/* Footer */
	.footer {
		border-top: 1px solid rgba(176, 176, 176, 0.2);
		padding: 1.5rem 2rem;
	}

	.footer-content {
		max-width: 720px;
		margin: 0 auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.75rem 1.5rem;
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.footer-site-name {
		font-weight: 500;
	}

	.footer-powered {
		opacity: 0.7;
	}

	.footer-admin-link {
		color: var(--color-accent);
		text-decoration: none;
		font-weight: 500;
		transition: opacity 0.15s ease;
		margin-left: auto;
	}

	.footer-admin-link:hover {
		opacity: 0.8;
		text-decoration: underline;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-content h1 {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1rem;
		}

		.cta-button {
			font-size: 1rem;
			padding: 0.75rem 1.5rem;
		}

		.about {
			padding: 2.5rem 1.25rem;
		}

		.next-event-section,
		.upcoming-events-section {
			padding: 2rem 1.25rem;
		}

		.next-event-card {
			padding: 1.25rem;
		}

		.next-event-title {
			font-size: 1.15rem;
		}

		.next-event-meta {
			gap: 0.5rem;
		}

		.upcoming-event-row {
			flex-wrap: wrap;
			gap: 0.4rem 0.75rem;
		}

		.upcoming-event-title {
			flex: 1 1 100%;
		}

		.footer-content {
			flex-direction: column;
			text-align: center;
			gap: 0.5rem;
		}

		.footer-admin-link {
			margin-left: 0;
		}

		.hero-logo {
			width: 80px;
			height: 80px;
			margin-bottom: 1rem;
		}
	}
</style>
