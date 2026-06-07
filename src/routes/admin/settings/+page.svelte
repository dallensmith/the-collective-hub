<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	let settings = $derived($page.data.settings);
	let form = $derived($page.form);

	let featuresJson = $state('');
	let initialized = $state(false);

	$effect(() => {
		// Initialize featuresJson from settings on first load and after form submission
		if (settings?.contentFeatures && !initialized) {
			featuresJson = JSON.stringify(settings.contentFeatures, null, 2);
			initialized = true;
		}
	});

	function updateFeaturesJson(e: Event) {
		featuresJson = (e.target as HTMLTextAreaElement).value;
	}
</script>

<h1 class="mb-1 text-3xl font-bold">Site Settings</h1>
<p class="mb-8 text-gray-600">Customize your landing page content</p>

{#if form?.success}
	<div class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
		Settings saved successfully!
	</div>
{/if}

{#if form?.error}
	<div class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
		{form.error}
	</div>
{/if}

<form method="POST" use:enhance class="space-y-6">
	<!-- Site Name -->
	<div>
		<label for="siteName" class="mb-1 block text-sm font-medium text-gray-700">Site Name</label>
		<input
			id="siteName"
			name="siteName"
			type="text"
			value={settings?.siteName ?? ''}
			class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
		/>
	</div>

	<!-- Hero Section -->
	<fieldset class="rounded-lg border border-gray-200 p-4">
		<legend class="px-2 text-sm font-semibold text-gray-700">Hero Section</legend>
		<div class="space-y-4">
			<div>
				<label for="heroHeading" class="mb-1 block text-sm font-medium text-gray-700">Heading</label>
				<input
					id="heroHeading"
					name="heroHeading"
					type="text"
					value={settings?.heroHeading ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
				/>
			</div>
			<div>
				<label for="heroSubtitle" class="mb-1 block text-sm font-medium text-gray-700">Subtitle</label>
				<input
					id="heroSubtitle"
					name="heroSubtitle"
					type="text"
					value={settings?.heroSubtitle ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
				/>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="heroCtaText" class="mb-1 block text-sm font-medium text-gray-700">CTA Button Text</label>
					<input
						id="heroCtaText"
						name="heroCtaText"
						type="text"
						value={settings?.heroCtaText ?? ''}
						class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
					/>
				</div>
				<div>
					<label for="heroCtaLink" class="mb-1 block text-sm font-medium text-gray-700">CTA Button Link</label>
					<input
						id="heroCtaLink"
						name="heroCtaLink"
						type="text"
						value={settings?.heroCtaLink ?? ''}
						class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
					/>
				</div>
			</div>
		</div>
	</fieldset>

	<!-- Features -->
	<fieldset class="rounded-lg border border-gray-200 p-4">
		<legend class="px-2 text-sm font-semibold text-gray-700">Feature Cards</legend>
		<div>
			<label for="contentFeatures" class="mb-1 block text-sm font-medium text-gray-700">
				Features (JSON format)
			</label>
			<textarea
				id="contentFeatures"
				name="contentFeatures"
				rows="8"
				bind:value={featuresJson}
				class="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-xs focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
			></textarea>
			<p class="mt-1 text-xs text-gray-500">
				Array of objects with <code>icon</code>, <code>title</code>, and <code>description</code> fields.
				Example: <code>[&#123;"icon":"🎬","title":"Screenings","description":"Schedule and manage..."&#125;]</code>
			</p>
		</div>
	</fieldset>

	<!-- CTA Section -->
	<fieldset class="rounded-lg border border-gray-200 p-4">
		<legend class="px-2 text-sm font-semibold text-gray-700">Call-to-Action Section</legend>
		<div class="space-y-4">
			<div>
				<label for="ctaHeading" class="mb-1 block text-sm font-medium text-gray-700">Heading</label>
				<input
					id="ctaHeading"
					name="ctaHeading"
					type="text"
					value={settings?.ctaHeading ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
				/>
			</div>
			<div>
				<label for="ctaText" class="mb-1 block text-sm font-medium text-gray-700">Text</label>
				<input
					id="ctaText"
					name="ctaText"
					type="text"
					value={settings?.ctaText ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
				/>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="ctaButtonText" class="mb-1 block text-sm font-medium text-gray-700">Button Text</label>
					<input
						id="ctaButtonText"
						name="ctaButtonText"
						type="text"
						value={settings?.ctaButtonText ?? ''}
						class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
					/>
				</div>
				<div>
					<label for="ctaButtonLink" class="mb-1 block text-sm font-medium text-gray-700">Button Link</label>
					<input
						id="ctaButtonLink"
						name="ctaButtonLink"
						type="text"
						value={settings?.ctaButtonLink ?? ''}
						class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
					/>
				</div>
			</div>
		</div>
	</fieldset>

	<!-- Footer -->
	<fieldset class="rounded-lg border border-gray-200 p-4">
		<legend class="px-2 text-sm font-semibold text-gray-700">Footer</legend>
		<div>
			<label for="footerText" class="mb-1 block text-sm font-medium text-gray-700">Footer Text</label>
			<input
				id="footerText"
				name="footerText"
				type="text"
				value={settings?.footerText ?? ''}
				class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
			/>
		</div>
	</fieldset>

	<div class="border-t border-gray-200 pt-4">
		<button
			type="submit"
			class="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
		>
			Save Settings
		</button>
	</div>
</form>
