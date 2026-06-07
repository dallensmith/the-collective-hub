<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let themes = $derived(data.themes);
	let currentThemeId = $derived(data.currentThemeId);
	let currentThemeMode = $derived(data.currentThemeMode);

	// Initialize selected from the current theme and mode; updated on form submission
	let selected = $state(currentThemeId);
	let selectedMode = $state(currentThemeMode);
</script>

<h1 class="mb-1 text-3xl font-bold">Theme</h1>
<p class="mb-8 text-gray-600">Choose a color scheme for your site.</p>

<form method="POST" use:enhance>
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		{#each themes as theme}
			<label
				class="block cursor-pointer rounded-xl border-2 p-4 transition-all {selected === theme.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}"
			>
				<input
					type="radio"
					name="themePreset"
					value={theme.id}
					bind:group={selected}
					class="sr-only"
				/>

				<h3 class="text-lg font-semibold">{theme.name}</h3>
				<p class="mb-4 text-sm text-gray-500">{theme.description}</p>

				<!-- Color swatches (light mode) -->
				<div class="mb-4 flex gap-2">
					<div class="h-8 w-8 rounded-full border" style="background: {theme.colors.light.primary}" title="Primary"></div>
					<div class="h-8 w-8 rounded-full border" style="background: {theme.colors.light.bg}" title="Background"></div>
					<div class="h-8 w-8 rounded-full border" style="background: {theme.colors.light['hero-bg']}" title="Hero"></div>
					<div class="h-8 w-8 rounded-full border" style="background: {theme.colors.light.surface}" title="Surface"></div>
					<div class="h-8 w-8 rounded-full border" style="background: {theme.colors.light['footer-bg']}" title="Footer"></div>
				</div>

				<!-- Mini preview (light mode) -->
				<div
					class="overflow-hidden rounded-lg border text-xs"
					style="background: {theme.colors.light.bg}; color: {theme.colors.light.text}"
				>
					<div class="p-2 font-semibold" style="background: {theme.colors.light['hero-bg']}; color: {theme.colors.light['hero-text']}">
						Site Header
					</div>
					<div class="space-y-2 p-2">
						<p style="color: {theme.colors.light.text}">Sample content text</p>
						<p style="color: {theme.colors.light['text-secondary']}">Secondary text example</p>
						<span
							class="inline-block rounded px-3 py-1 text-xs font-medium text-white"
							style="background: {theme.colors.light.primary}"
						>
							Button
						</span>
					</div>
					<div class="p-2 text-center" style="background: {theme.colors.light['footer-bg']}; color: {theme.colors.light['footer-text']}">
						Footer
					</div>
				</div>
			</label>
		{/each}
	</div>

	<!-- Color Mode Selection -->
	<div class="mt-8">
		<h2 class="mb-4 text-lg font-semibold">Color Mode</h2>
		<div class="flex gap-4">
			<label
				class="flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all {selectedMode === 'light' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}"
			>
				<input
					type="radio"
					name="themeMode"
					value="light"
					bind:group={selectedMode}
					class="sr-only"
				/>
				<span class="text-xl">☀️</span>
				<div>
					<div class="font-medium">Light</div>
					<div class="text-xs text-gray-500">Light background, dark text</div>
				</div>
			</label>
			<label
				class="flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all {selectedMode === 'dark' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}"
			>
				<input
					type="radio"
					name="themeMode"
					value="dark"
					bind:group={selectedMode}
					class="sr-only"
				/>
				<span class="text-xl">🌙</span>
				<div>
					<div class="font-medium">Dark</div>
					<div class="text-xs text-gray-500">Dark background, light text</div>
				</div>
			</label>
		</div>
	</div>

	<div class="mt-6">
		<button
			type="submit"
			class="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
		>
			Save Theme
		</button>
	</div>

	{#if form?.success}
		<p class="mt-4 font-medium text-green-600">Theme saved!</p>
	{/if}
	{#if form?.error}
		<p class="mt-4 font-medium text-red-600">{form.error}</p>
	{/if}
</form>
