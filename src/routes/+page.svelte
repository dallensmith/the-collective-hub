<script lang="ts">
	import { page } from '$app/stores';

	let settings = $derived($page.data.settings);
</script>

<!-- Hero -->
<section
	class="flex min-h-[80vh] flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 px-4 text-center text-white"
>
	<h1 class="mb-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
		{settings?.heroHeading ?? 'Your Community Hub for Screenings & Events'}
	</h1>
	<p class="mb-10 max-w-xl text-lg text-gray-300 sm:text-xl">
		{settings?.heroSubtitle ?? 'A space to share, discover, and celebrate the films and shows that bring us together.'}
	</p>
	<div class="flex flex-col gap-4 sm:flex-row">
		<a
			href={settings?.heroCtaLink ?? '/login'}
			class="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-gray-900 shadow transition hover:bg-gray-100"
		>
			{settings?.heroCtaText ?? 'Get Started'}
		</a>
		<a
			href="#content"
			class="rounded-lg border border-gray-400 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
		>
			Learn More
		</a>
	</div>
</section>

<!-- Content / Features -->
<section id="content" class="bg-white px-4 py-20 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-5xl">
		<h2 class="mb-12 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
			Everything you need to build community
		</h2>
		<div class="grid gap-8 md:grid-cols-3">
			{#each settings?.contentFeatures ?? [] as feature}
				<div class="rounded-xl border border-gray-200 p-6 text-center shadow-sm transition hover:shadow-md">
					<div class="mb-4 text-4xl">{feature.icon}</div>
					<h3 class="mb-2 text-xl font-semibold text-gray-900">{feature.title}</h3>
					<p class="text-gray-600">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA -->
<section class="bg-gray-900 px-4 py-20 text-center text-white sm:px-6 lg:px-8">
	<div class="mx-auto max-w-2xl">
		<h2 class="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
			{settings?.ctaHeading ?? 'Ready to get started?'}
		</h2>
		<p class="mb-8 text-lg text-gray-300">
			{settings?.ctaText ?? 'Set up your community hub in minutes.'}
		</p>
		<a
			href={settings?.ctaButtonLink ?? '/login'}
			class="inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-gray-900 shadow transition hover:bg-gray-100"
		>
			{settings?.ctaButtonText ?? 'Login with Discord'}
		</a>
	</div>
</section>
