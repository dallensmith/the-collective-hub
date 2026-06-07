<script lang="ts">
	import { page } from '$app/stores';

	let isAuthenticated = $derived($page.data.isAuthenticated as boolean);
	let isAuthorized = $derived($page.data.isAuthorized as boolean);
	let settings = $derived($page.data.settings);
</script>

<!-- Hero -->
<section
	class="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center"
	style="background: linear-gradient(to bottom, var(--color-hero-bg), var(--color-hero-bg-end)); color: var(--color-hero-text)"
>
	<h1 class="mb-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
		{settings?.heroHeading ?? 'Your Community Hub for Screenings & Events'}
	</h1>
	<p class="mb-10 max-w-xl text-lg sm:text-xl" style="color: color-mix(in srgb, var(--color-hero-text) 70%, transparent)">
		{settings?.heroSubtitle ?? 'A space to share, discover, and celebrate the films and shows that bring us together.'}
	</p>
	<div class="flex flex-col gap-4 sm:flex-row">
		{#if isAuthenticated}
			{#if isAuthorized}
				<a
					href="/admin"
					class="rounded-lg px-8 py-3 text-sm font-semibold shadow transition"
					style="background: var(--color-primary); color: white"
				>
					Dashboard
				</a>
			{/if}
		{:else}
			<a
				href="/login"
				class="rounded-lg px-8 py-3 text-sm font-semibold shadow transition"
				style="background: var(--color-primary); color: white"
			>
				{settings?.heroCtaText ?? 'Get Started'}
			</a>
		{/if}
		<a
			href="#content"
			class="rounded-lg border px-8 py-3 text-sm font-semibold transition"
			style="border-color: color-mix(in srgb, var(--color-hero-text) 40%, transparent); color: var(--color-hero-text)"
		>
			{settings?.heroSecondaryCtaText ?? 'Learn More'}
		</a>
	</div>
</section>

<!-- Content / Features -->
<section class="px-4 py-20 sm:px-6 lg:px-8" style="background: var(--color-bg)">
	<div class="mx-auto max-w-5xl">
		<h2 class="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl" style="color: var(--color-text)">
			{settings?.contentHeading ?? 'Everything you need'}
		</h2>
		{#if settings?.contentSubtitle}
			<p
				class="mb-12 text-center text-lg"
				style="color: var(--color-text-secondary)"
			>
				{settings?.contentSubtitle}
			</p>
		{/if}
		<div class="grid gap-8 md:grid-cols-3">
			{#each settings?.contentFeatures ?? [] as feature}
				<div class="rounded-xl border p-6 text-center shadow-sm transition hover:shadow-md" style="border-color: var(--color-border); background: var(--color-surface)">
					<div class="mb-4 text-4xl">{feature.icon}</div>
					<h3 class="mb-2 text-xl font-semibold" style="color: var(--color-text)">{feature.title}</h3>
					<p style="color: var(--color-text-secondary)">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA -->
<section class="px-4 py-20 text-center sm:px-6 lg:px-8" style="background: var(--color-cta-bg); color: var(--color-cta-text)">
	<div class="mx-auto max-w-2xl">
		<h2 class="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
			{settings?.ctaHeading ?? 'Ready to get started?'}
		</h2>
		<p class="mb-8 text-lg" style="color: color-mix(in srgb, var(--color-cta-text) 70%, transparent)">
			{settings?.ctaText ?? 'Set up your community hub in minutes.'}
		</p>
		{#if !isAuthenticated}
			<a
				href="/login"
				class="inline-block rounded-lg px-8 py-3 text-sm font-semibold shadow transition"
				style="background: var(--color-primary); color: white"
			>
				{settings?.ctaButtonText ?? 'Login with Discord'}
			</a>
		{/if}
	</div>
</section>
