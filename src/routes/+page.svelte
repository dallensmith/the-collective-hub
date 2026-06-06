<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * Determine if a link is external (starts with http:// or https://).
	 * Internal links (starting with `/`) navigate normally.
	 */
	function isExternal(href: string): boolean {
		return /^https?:\/\//.test(href);
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
	<!-- HERO SECTION -->
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

	<!-- ABOUT SECTION (only if aboutText is set) -->
	{#if data.aboutText}
		<section class="about">
			<div class="about-content">
				<h2>About</h2>
				<p>{data.aboutText}</p>
			</div>
		</section>
	{/if}

	<!-- FOOTER -->
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
