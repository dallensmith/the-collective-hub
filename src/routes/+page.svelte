<script lang="ts">
	import { page } from '$app/stores';

	let isAuthenticated = $derived($page.data.isAuthenticated as boolean);
	let isAuthorized = $derived($page.data.isAuthorized as boolean);
	let settings = $derived($page.data.settings);
</script>

<!-- Hero -->
<section
	class="flex min-h-[80vh] flex-col items-center justify-center bg-gradient-to-b from-hero-bg to-hero-bg-end px-4 text-center text-hero-text"
>
	<h1 class="mb-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
		{settings?.heroHeading ?? 'Your Community Hub for Screenings & Events'}
	</h1>
	<p class="mb-10 max-w-xl text-lg text-hero-text/70 sm:text-xl">
		{settings?.heroSubtitle ?? 'A space to share, discover, and celebrate the films and shows that bring us together.'}
	</p>
	<div class="flex flex-col gap-4 sm:flex-row">
		{#if isAuthenticated}
			{#if isAuthorized}
				<a
					href="/admin"
					class="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white shadow transition"
				>
					Dashboard
				</a>
			{/if}
		{:else}
			<a
				href="/login"
				class="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white shadow transition"
			>
				{settings?.heroCtaText ?? 'Get Started'}
			</a>
		{/if}
		<a
			href="#content"
			class="rounded-lg border border-hero-text/40 px-8 py-3 text-sm font-semibold text-hero-text transition"
		>
			{settings?.heroSecondaryCtaText ?? 'Learn More'}
		</a>
	</div>
</section>

<!-- Content / Features -->
<section class="bg-bg px-4 py-20 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-5xl">
		<h2 class="mb-4 text-center text-3xl font-bold tracking-tight text-text sm:text-4xl">
			{settings?.contentHeading ?? 'Everything you need'}
		</h2>
		{#if settings?.contentSubtitle}
			<p
				class="mb-12 text-center text-lg text-text-secondary"
			>
				{settings?.contentSubtitle}
			</p>
		{/if}
		<div class="grid gap-8 md:grid-cols-3">
			{#each settings?.contentFeatures ?? [] as feature}
				<div class="rounded-xl border border-border bg-surface p-6 text-center shadow-sm transition hover:shadow-md">
					<div class="mb-4 text-4xl">{feature.icon}</div>
					<h3 class="mb-2 text-xl font-semibold text-text">{feature.title}</h3>
					<p class="text-text-secondary">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA -->
<section class="bg-cta-bg px-4 py-20 text-center text-cta-text sm:px-6 lg:px-8">
	<div class="mx-auto max-w-2xl">
		<h2 class="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
			{settings?.ctaHeading ?? 'Ready to get started?'}
		</h2>
		<p class="mb-8 text-lg text-cta-text/70">
			{settings?.ctaText ?? 'Set up your community hub in minutes.'}
		</p>
		{#if !isAuthenticated}
			<a
				href="/login"
				class="inline-block rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white shadow transition"
			>
				{settings?.ctaButtonText ?? 'Login with Discord'}
			</a>
		{/if}
	</div>
</section>
