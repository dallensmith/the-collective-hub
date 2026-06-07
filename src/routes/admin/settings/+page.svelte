<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { FeatureCard } from '$lib/server/settings';

	let form = $derived($page.form);

	let features = $state(
		($page.data.settings?.contentFeatures as FeatureCard[] | undefined)?.map(
			(f: FeatureCard) => ({ ...f })
		) ?? []
	);

	let featuresJson = $derived(JSON.stringify(features));

	function addFeature() {
		features = [...features, { icon: '📌', title: '', description: '' }];
	}

	function removeFeature(index: number) {
		if (features.length > 1) {
			features = features.filter((_f: FeatureCard, i: number) => i !== index);
		}
	}
</script>

<h1 class="mb-1 text-3xl font-bold">Site Settings</h1>
<p class="mb-8 text-gray-600">Customize your landing page content</p>

{#if form?.success}
	<div
		class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
	>
		Settings saved successfully!
	</div>
{/if}

{#if form?.error}
	<div
		class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
	>
		{form.error}
	</div>
{/if}

<form method="POST" use:enhance class="space-y-8">
	<input type="hidden" name="contentFeatures" value={featuresJson} />

	<!-- 1. Site Name -->
	<fieldset class="rounded-lg border border-gray-200 p-4">
		<legend class="px-2 text-sm font-semibold text-gray-700">Site Name</legend>
		<div>
			<label for="siteName" class="mb-1 block text-sm font-medium text-gray-700">
				Site Name
			</label>
			<input
				id="siteName"
				name="siteName"
				type="text"
				value={$page.data.settings?.siteName ?? ''}
				class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
			/>
		</div>
	</fieldset>

	<!-- 2. Hero Section -->
	<fieldset class="rounded-lg border border-gray-200 p-4">
		<legend class="px-2 text-sm font-semibold text-gray-700">Hero Section</legend>
		<div class="space-y-4">
			<div>
				<label for="heroHeading" class="mb-1 block text-sm font-medium text-gray-700">
					Heading
				</label>
				<input
					id="heroHeading"
					name="heroHeading"
					type="text"
					value={$page.data.settings?.heroHeading ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
				/>
			</div>
			<div>
				<label for="heroSubtitle" class="mb-1 block text-sm font-medium text-gray-700">
					Subtitle
				</label>
				<input
					id="heroSubtitle"
					name="heroSubtitle"
					type="text"
					value={$page.data.settings?.heroSubtitle ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
				/>
			</div>
			<div>
				<label for="heroCtaText" class="mb-1 block text-sm font-medium text-gray-700">
					Button Text
				</label>
				<input
					id="heroCtaText"
					name="heroCtaText"
					type="text"
					value={$page.data.settings?.heroCtaText ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
				/>
				<p class="mt-1 text-xs text-gray-500">Button links to the login page</p>
			</div>
		</div>
	</fieldset>

	<!-- 3. Features -->
	<fieldset class="rounded-lg border border-gray-200 p-4">
		<legend class="px-2 text-sm font-semibold text-gray-700">Features</legend>
		<div class="space-y-4">
			{#each features as feature, i}
				<div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">Feature {i + 1}</span>
						<button
							type="button"
							onclick={() => removeFeature(i)}
							disabled={features.length <= 1}
							class="cursor-pointer rounded p-1 text-gray-400 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
							title="Remove feature"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</div>
					<div class="grid gap-3 sm:grid-cols-3">
						<div>
							<label for="feature_{i}_icon" class="mb-1 block text-xs font-medium text-gray-600">
								Icon
							</label>
							<input
								id="feature_{i}_icon"
								type="text"
								bind:value={features[i].icon}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
							/>
						</div>
						<div>
							<label for="feature_{i}_title" class="mb-1 block text-xs font-medium text-gray-600">
								Title
							</label>
							<input
								id="feature_{i}_title"
								type="text"
								bind:value={features[i].title}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
							/>
						</div>
						<div>
							<label for="feature_{i}_description" class="mb-1 block text-xs font-medium text-gray-600">
								Description
							</label>
							<textarea
								id="feature_{i}_description"
								rows="2"
								bind:value={features[i].description}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
							></textarea>
						</div>
					</div>
				</div>
			{/each}

			<button
				type="button"
				onclick={addFeature}
				class="cursor-pointer rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
			>
				+ Add Feature
			</button>
			<p class="text-xs text-gray-500">Paste an emoji like 🎬 or 👥 for the icon</p>
		</div>
	</fieldset>

	<!-- 4. Call-to-Action Section -->
	<fieldset class="rounded-lg border border-gray-200 p-4">
		<legend class="px-2 text-sm font-semibold text-gray-700">Call-to-Action Section</legend>
		<div class="space-y-4">
			<div>
				<label for="ctaHeading" class="mb-1 block text-sm font-medium text-gray-700">
					Heading
				</label>
				<input
					id="ctaHeading"
					name="ctaHeading"
					type="text"
					value={$page.data.settings?.ctaHeading ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
				/>
			</div>
			<div>
				<label for="ctaText" class="mb-1 block text-sm font-medium text-gray-700">
					Text
				</label>
				<input
					id="ctaText"
					name="ctaText"
					type="text"
					value={$page.data.settings?.ctaText ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
				/>
			</div>
			<div>
				<label for="ctaButtonText" class="mb-1 block text-sm font-medium text-gray-700">
					Button Text
				</label>
				<input
					id="ctaButtonText"
					name="ctaButtonText"
					type="text"
					value={$page.data.settings?.ctaButtonText ?? ''}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
				/>
				<p class="mt-1 text-xs text-gray-500">Button links to the login page</p>
			</div>
		</div>
	</fieldset>

	<!-- 5. Footer -->
	<fieldset class="rounded-lg border border-gray-200 p-4">
		<legend class="px-2 text-sm font-semibold text-gray-700">Footer</legend>
		<div>
			<label for="footerText" class="mb-1 block text-sm font-medium text-gray-700">
				Footer Text
			</label>
			<input
				id="footerText"
				name="footerText"
				type="text"
				value={$page.data.settings?.footerText ?? ''}
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
