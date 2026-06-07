<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let themes = $derived(data.themes);

	// Initialize selected from the current theme; updated on form submission
	let selected = $state(initSelected());

	function initSelected() {
		return data.currentThemeId;
	}
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

				<!-- Color swatches -->
				<div class="mb-4 flex gap-2">
					<div class="h-8 w-8 rounded-full border" style="background: {theme.colors.primary}" title="Primary"></div>
					<div class="h-8 w-8 rounded-full border" style="background: {theme.colors.bg}" title="Background"></div>
					<div class="h-8 w-8 rounded-full border" style="background: {theme.colors['hero-bg']}" title="Hero"></div>
					<div class="h-8 w-8 rounded-full border" style="background: {theme.colors.surface}" title="Surface"></div>
					<div class="h-8 w-8 rounded-full border" style="background: {theme.colors['footer-bg']}" title="Footer"></div>
				</div>

				<!-- Mini preview -->
				<div
					class="overflow-hidden rounded-lg border text-xs"
					style="background: {theme.colors.bg}; color: {theme.colors.text}"
				>
					<div class="p-2 font-semibold" style="background: {theme.colors['hero-bg']}; color: {theme.colors['hero-text']}">
						Site Header
					</div>
					<div class="space-y-2 p-2">
						<p style="color: {theme.colors.text}">Sample content text</p>
						<p style="color: {theme.colors['text-secondary']}">Secondary text example</p>
						<span
							class="inline-block rounded px-3 py-1 text-xs font-medium text-white"
							style="background: {theme.colors.primary}"
						>
							Button
						</span>
					</div>
					<div class="p-2 text-center" style="background: {theme.colors['footer-bg']}; color: {theme.colors['footer-text']}">
						Footer
					</div>
				</div>
			</label>
		{/each}
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
