<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	/**
	 * Compute the relative luminance of a hex color (WCAG).
	 * Used to determine whether the background is dark or light
	 * so we can pick an appropriate secondary text color.
	 */
	function hexLuminance(hex: string): number {
		const h = hex.replace('#', '');
		const r = parseInt(h.substring(0, 2), 16) / 255;
		const g = parseInt(h.substring(2, 4), 16) / 255;
		const b = parseInt(h.substring(4, 6), 16) / 255;
		const toLinear = (c: number) =>
			c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
		return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
	}

	// ── Theme preset defaults ──────────────────────────────────────────────────
	const DARK_PRESET = {
		accentColor: '#e63946',
		backgroundColor: '#1a1a2e',
		textColor: '#eaeaea'
	} as const;

	const LIGHT_PRESET = {
		accentColor: '#e63946',
		backgroundColor: '#ffffff',
		textColor: '#1a1a2e'
	} as const;

	// ── Theme values (reactive via $derived — updates if data.siteSettings changes) ──
	const theme = $derived(data.siteSettings?.theme);
	const preset = $derived(theme?.preset ?? 'dark');

	// Resolve colors based on preset + any stored overrides
	let accentColor = $derived(
		theme?.accentColor ||
			(preset === 'light' ? LIGHT_PRESET.accentColor : DARK_PRESET.accentColor)
	);
	let backgroundColor = $derived(
		theme?.backgroundColor ||
			(preset === 'light' ? LIGHT_PRESET.backgroundColor : DARK_PRESET.backgroundColor)
	);
	let textColor = $derived(
		theme?.textColor ||
			(preset === 'light' ? LIGHT_PRESET.textColor : DARK_PRESET.textColor)
	);

	// Secondary text: muted version based on background luminance
	let textSecondary = $derived(
		hexLuminance(backgroundColor) < 0.5 ? '#b0b0b0' : '#555555'
	);

	// Derived card/border colors for a polished look
	let cardBackground = $derived(
		preset === 'light'
			? 'rgba(0, 0, 0, 0.03)'
			: 'rgba(255, 255, 255, 0.05)'
	);
	let borderColor = $derived(
		preset === 'light'
			? 'rgba(0, 0, 0, 0.08)'
			: 'rgba(255, 255, 255, 0.08)'
	);

	let cssVars = $derived(
		[
			`--color-accent: ${accentColor}`,
			`--color-background: ${backgroundColor}`,
			`--color-text: ${textColor}`,
			`--color-text-secondary: ${textSecondary}`,
			`--color-card-background: ${cardBackground}`,
			`--color-border: ${borderColor}`,
			`--font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
		].join('; ')
	);
</script>

<div class="site-root" style={cssVars}>
	{@render children()}
</div>

<style>
	.site-root {
		min-height: 100vh;
		background: var(--color-background);
		color: var(--color-text);
		font-family: var(--font-family);
	}

	:global(body) {
		margin: 0;
	}
</style>
