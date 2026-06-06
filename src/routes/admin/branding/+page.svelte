<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	/** Whether the form is currently being submitted */
	let saving = $state(false);

	/** Feedback message shown after save attempt */
	let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	/** Whether the logo asset picker dropdown is open */
	let logoPickerOpen = $state(false);
	/** Whether the background asset picker dropdown is open */
	let bgPickerOpen = $state(false);

	// Currently selected logo/background CDN keys (bound to form)
	let logoCdnKey = $state('');
	$effect(() => {
		logoCdnKey = data.branding?.logoCdnKey ?? '';
	});
	let backgroundCdnKey = $state('');
	$effect(() => {
		backgroundCdnKey = data.branding?.backgroundCdnKey ?? '';
	});

	// Favicon CDN key — initialised from saved branding, updated on upload
	let faviconCdnKey = $state('');
	$effect(() => {
		faviconCdnKey = data.branding?.faviconCdnKey ?? '';
	});

	// Theme values
	let themePreset = $state('dark');
	$effect(() => {
		themePreset = data.theme?.preset ?? 'dark';
	});
	let accentColor = $state('#e63946');
	$effect(() => {
		accentColor = data.theme?.accentColor ?? '#e63946';
	});
	let backgroundColor = $state('#1a1a2e');
	$effect(() => {
		backgroundColor = data.theme?.backgroundColor ?? '#1a1a2e';
	});
	let textColor = $state('#eaeaea');
	$effect(() => {
		textColor = data.theme?.textColor ?? '#eaeaea';
	});

	// Site name & tagline (from branding, so pre-fill from current settings)
	let siteName = $state('');
	$effect(() => {
		siteName = data.branding?.siteName ?? $page.data.site?.name ?? '';
	});
	let tagline = $state('');
	$effect(() => {
		tagline = data.branding?.tagline ?? '';
	});

	// Clear feedback when form action data changes (new submission)
	$effect(() => {
		if (form) {
			saving = false;
			if (form.success) {
				if ((form as Record<string, unknown>).draftSaved) {
					feedback = { type: 'success', message: 'Draft saved. Changes are not yet live.' };
				} else if ((form as Record<string, unknown>).published) {
					feedback = { type: 'success', message: 'Branding published and live.' };
				} else if ((form as Record<string, unknown>).draftsDiscarded) {
					feedback = { type: 'success', message: 'Drafts discarded.' };
				} else {
					feedback = { type: 'success', message: 'Branding settings saved.' };
				}
			} else if (form.error) {
				feedback = { type: 'error', message: form.error };
			}
		}
	});

	/** Called by use:enhance before form submission */
	function handleEnhance() {
		saving = true;
		feedback = null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return ({ result }: any) => {
			saving = false;
			if (result.type === 'success') {
				// The $effect above will set feedback from form data
			} else if (result.type === 'failure') {
				feedback = {
					type: 'error',
					message: (result.data?.error as string) ?? 'Failed to save branding settings.'
				};
			} else if (result.type === 'error') {
				feedback = {
					type: 'error',
					message: 'A network error occurred. Please try again.'
				};
			}
		};
	}

	interface AssetItem {
		id: string;
		filename: string;
		cdnKey: string;
		cdnUrl: string;
		mimeType: string | null;
	}

	/** Get the CDN URL for a given CDN key from the asset list */
	function getAssetUrl(cdnKey: string): string | undefined {
		return (data.assetList as AssetItem[]).find((a) => a.cdnKey === cdnKey)?.cdnUrl;
	}

	/** Select a logo from the asset picker */
	function selectLogo(cdnKey: string) {
		logoCdnKey = cdnKey;
		logoPickerOpen = false;
	}

	/** Select a background from the asset picker */
	function selectBackground(cdnKey: string) {
		backgroundCdnKey = cdnKey;
		bgPickerOpen = false;
	}

	/** Handle favicon upload via the API endpoint */
	async function handleFaviconUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await fetch('/api/assets', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Upload failed.' }));
				feedback = { type: 'error', message: err.message ?? 'Favicon upload failed.' };
			} else {
				const asset = await res.json() as AssetItem;
				// Update the favicon key reactively so the form includes it on save
				faviconCdnKey = asset.cdnKey;
				// Prepend the new asset to the list so it appears in asset pickers
				data.assetList.unshift(asset);
				feedback = { type: 'success', message: 'Favicon uploaded. Click Save Branding to apply.' };
			}
		} catch {
			feedback = { type: 'error', message: 'Network error during upload.' };
		} finally {
			input.value = '';
		}
	}

	/** Close pickers when clicking outside */
	function handlePickerClose() {
		logoPickerOpen = false;
		bgPickerOpen = false;
	}

</script>

<svelte:head>
	<title>Branding — {$page.data.site?.name ?? 'Admin'}</title>
</svelte:head>

<!-- Click-outside backdrop for pickers -->
{#if logoPickerOpen || bgPickerOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="picker-backdrop" onclick={handlePickerClose}></div>
{/if}

<div class="branding-page">
	<h1 class="page-title">Branding</h1>
	<p class="page-desc">Customize your site's visual identity, logo, and theme colors.</p>

	<!-- Feedback message -->
	{#if feedback}
		<div
			class="feedback"
			class:feedback--success={feedback.type === 'success'}
			class:feedback--error={feedback.type === 'error'}
			role="alert"
		>
			{#if feedback.type === 'success'}✓{:else}⚠{/if}
			{feedback.message}
			<button class="feedback-close" onclick={() => (feedback = null)}>×</button>
		</div>
	{/if}

	<form method="POST" use:enhance={handleEnhance} class="branding-form">
		<fieldset disabled={saving}>
			<!-- ═══════════════════════════════════════════ -->
			<!-- Logo -->
			<!-- ═══════════════════════════════════════════ -->
			<div class="form-group">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="form-label">Logo</label>
				<div class="asset-selector">
					<div class="asset-preview-box">
						{#if logoCdnKey && getAssetUrl(logoCdnKey)}
							<img
								src={getAssetUrl(logoCdnKey)}
								alt="Selected logo"
								class="asset-preview-img"
							/>
						{:else}
							<span class="asset-preview-placeholder">No logo selected</span>
						{/if}
					</div>
					<div class="asset-selector-actions">
						<button
							type="button"
							class="select-btn"
							onclick={() => (logoPickerOpen = !logoPickerOpen)}
						>
							{logoCdnKey ? 'Change Logo' : 'Select from Assets'}
						</button>
						{#if logoCdnKey}
							<button
								type="button"
								class="clear-btn"
								onclick={() => (logoCdnKey = '')}
							>
								Clear
							</button>
						{/if}
					</div>

					<!-- Asset picker dropdown -->
					{#if logoPickerOpen}
						<div class="picker-dropdown">
							{#if data.assetList.length === 0}
								<p class="picker-empty">
									No assets uploaded yet.
									<a href="/admin/assets">Upload assets first</a>.
								</p>
							{:else}
								<div class="picker-grid">
									{#each data.assetList as asset}
										<button
											type="button"
											class="picker-item"
											class:picker-item--selected={logoCdnKey === asset.cdnKey}
											onclick={() => selectLogo(asset.cdnKey)}
										>
											<img
												src={asset.cdnUrl}
												alt={asset.filename}
												loading="lazy"
											/>
											<span class="picker-item-name">{asset.filename}</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
				<input type="hidden" name="logoCdnKey" value={logoCdnKey} />
				<p class="form-help">
					Upload images in the <a href="/admin/assets">Assets</a> page, then select one here.
					Recommended: square image, PNG with transparency.
				</p>
			</div>

			<!-- ═══════════════════════════════════════════ -->
			<!-- Background Image -->
			<!-- ═══════════════════════════════════════════ -->
			<div class="form-group">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="form-label">Background Image</label>
				<div class="asset-selector">
					<div class="asset-preview-box">
						{#if backgroundCdnKey && getAssetUrl(backgroundCdnKey)}
							<img
								src={getAssetUrl(backgroundCdnKey)}
								alt="Selected background"
								class="asset-preview-img"
							/>
						{:else}
							<span class="asset-preview-placeholder">No background selected</span>
						{/if}
					</div>
					<div class="asset-selector-actions">
						<button
							type="button"
							class="select-btn"
							onclick={() => (bgPickerOpen = !bgPickerOpen)}
						>
							{backgroundCdnKey ? 'Change Background' : 'Select from Assets'}
						</button>
						{#if backgroundCdnKey}
							<button
								type="button"
								class="clear-btn"
								onclick={() => (backgroundCdnKey = '')}
							>
								Clear
							</button>
						{/if}
					</div>

					<!-- Asset picker dropdown -->
					{#if bgPickerOpen}
						<div class="picker-dropdown">
							{#if data.assetList.length === 0}
								<p class="picker-empty">
									No assets uploaded yet.
									<a href="/admin/assets">Upload assets first</a>.
								</p>
							{:else}
								<div class="picker-grid">
									{#each data.assetList as asset}
										<button
											type="button"
											class="picker-item"
											class:picker-item--selected={backgroundCdnKey === asset.cdnKey}
											onclick={() => selectBackground(asset.cdnKey)}
										>
											<img
												src={asset.cdnUrl}
												alt={asset.filename}
												loading="lazy"
											/>
											<span class="picker-item-name">{asset.filename}</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
				<input type="hidden" name="backgroundCdnKey" value={backgroundCdnKey} />
				<p class="form-help">
					Optional full-width background image for the hero section.
				</p>
			</div>

			<!-- ═══════════════════════════════════════════ -->
			<!-- Favicon -->
			<!-- ═══════════════════════════════════════════ -->
			<div class="form-group">
				<label class="form-label" for="favicon-upload">Favicon</label>
				<div class="favicon-row">
					{#if faviconCdnKey && getAssetUrl(faviconCdnKey)}
						<img
							src={getAssetUrl(faviconCdnKey)}
							alt="Current favicon"
							class="favicon-preview"
							width="32"
							height="32"
						/>
					{/if}
					<input
						type="file"
						id="favicon-upload"
						accept="image/png,image/jpeg,image/webp"
						class="favicon-input"
						onchange={handleFaviconUpload}
						disabled={saving}
					/>
				</div>
				<input
					type="hidden"
					name="faviconCdnKey"
					value={faviconCdnKey}
				/>
				<p class="form-help">
					Upload a favicon image. It will be added to your asset library. Recommended: 32×32 PNG.
				</p>
			</div>

			<!-- ═══════════════════════════════════════════ -->
			<!-- Site Name & Tagline (from branding) -->
			<!-- ═══════════════════════════════════════════ -->
			<div class="form-group">
				<label for="siteName" class="form-label">Site Name</label>
				<input
					type="text"
					id="siteName"
					name="siteName"
					class="form-input"
					bind:value={siteName}
					maxlength={100}
					placeholder="My Collective Site"
				/>
			</div>

			<div class="form-group">
				<label for="tagline" class="form-label">Tagline</label>
				<input
					type="text"
					id="tagline"
					name="tagline"
					class="form-input"
					bind:value={tagline}
					maxlength={200}
					placeholder="A community for…"
				/>
			</div>

			<!-- ═══════════════════════════════════════════ -->
			<!-- Section Divider -->
			<!-- ═══════════════════════════════════════════ -->
			<h2 class="section-title">Theme</h2>

			<!-- Theme Preset -->
			<div class="form-group">
				<label for="themePreset" class="form-label">Theme Preset</label>
				<select
					id="themePreset"
					name="themePreset"
					class="form-select"
					bind:value={themePreset}
				>
					<option value="dark">Dark</option>
					<option value="light">Light</option>
					<option value="custom">Custom</option>
				</select>
				<p class="form-help">
					{#if themePreset === 'dark'}
						Dark background with light text. Colors below are defaults and can be customized.
					{:else if themePreset === 'light'}
						Light background with dark text. Colors below are defaults and can be customized.
					{:else}
						Custom mode: you define all colors manually.
					{/if}
				</p>
			</div>

			<!-- Accent Color -->
			<div class="form-group">
				<label for="accentColor" class="form-label">Accent Color</label>
				<div class="color-picker-row">
					<input
						type="color"
						id="accentColor-picker"
						class="color-picker"
						bind:value={accentColor}
					/>
					<input
						type="text"
						id="accentColor"
						name="accentColor"
						class="form-input color-input"
						bind:value={accentColor}
						placeholder="#e63946"
						maxlength={7}
					/>
					<span class="color-swatch" style="background-color: {accentColor}"></span>
				</div>
				<p class="form-help">Used for buttons, links, and interactive elements.</p>
			</div>

			<!-- Background Color -->
			<div class="form-group">
				<label for="backgroundColor" class="form-label">Background Color</label>
				<div class="color-picker-row">
					<input
						type="color"
						id="backgroundColor-picker"
						class="color-picker"
						bind:value={backgroundColor}
					/>
					<input
						type="text"
						id="backgroundColor"
						name="backgroundColor"
						class="form-input color-input"
						bind:value={backgroundColor}
						placeholder="#1a1a2e"
						maxlength={7}
					/>
					<span class="color-swatch" style="background-color: {backgroundColor}"></span>
				</div>
				<p class="form-help">The main background color of the public site.</p>
			</div>

			<!-- Text Color -->
			<div class="form-group">
				<label for="textColor" class="form-label">Text Color</label>
				<div class="color-picker-row">
					<input
						type="color"
						id="textColor-picker"
						class="color-picker"
						bind:value={textColor}
					/>
					<input
						type="text"
						id="textColor"
						name="textColor"
						class="form-input color-input"
						bind:value={textColor}
						placeholder="#eaeaea"
						maxlength={7}
					/>
					<span class="color-swatch" style="background-color: {textColor}"></span>
				</div>
				<p class="form-help">The primary text color used across the public site.</p>
			</div>

			<!-- ═══════════════════════════════════════════ -->
			<!-- Live Preview Swatch -->
			<!-- ═══════════════════════════════════════════ -->
			<div class="theme-preview" style="background: {backgroundColor}; color: {textColor}">
				<span class="preview-label">Live Preview</span>
				<span class="preview-text">
					<span style="color: {accentColor}">Accent text</span> on background
				</span>
				<span class="preview-button" style="background: {accentColor}; color: #fff">
					Button
				</span>
			</div>

			<!-- ═══════════════════════════════════════════ -->
			<!-- Actions -->
			<!-- ═══════════════════════════════════════════ -->
			<div class="form-actions">
				<button
					type="submit"
					class="save-btn save-btn--draft"
					formaction="?/saveDraft"
					disabled={saving}
				>
					{#if saving}
						<span class="spinner"></span>
						Saving…
					{:else}
						Save Draft
					{/if}
				</button>
				<button
					type="submit"
					class="save-btn"
					formaction="?/publish"
					disabled={saving}
				>
					{#if saving}
						<span class="spinner"></span>
						Publishing…
					{:else}
						🗸 Publish
					{/if}
				</button>

				<a href="/" class="preview-link" target="_blank" rel="noopener noreferrer">
					↗ Preview Site
				</a>
			</div>
		</fieldset>
	</form>
</div>

<style>
	.branding-page {
		max-width: 640px;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 0.25rem;
		color: #1a1a2e;
	}

	.page-desc {
		color: #666;
		margin: 0 0 1.5rem;
		font-size: 0.925rem;
	}

	/* ── Feedback ───────────────────────────────────────────────── */
	.feedback {
		padding: 0.7rem 1rem;
		border-radius: 6px;
		margin-bottom: 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.feedback--success {
		background: #daf5e0;
		color: #1a6b30;
		border: 1px solid #a3d9b1;
	}

	.feedback--error {
		background: #fde8e8;
		color: #9b1c1c;
		border: 1px solid #f4b2b2;
	}

	.feedback-close {
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: inherit;
		opacity: 0.6;
		padding: 0 0.25rem;
		margin-left: auto;
	}

	.feedback-close:hover {
		opacity: 1;
	}

	/* ── Form ───────────────────────────────────────────────────── */
	.branding-form fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		font-weight: 600;
		font-size: 0.875rem;
		margin-bottom: 0.35rem;
		color: #1a1a2e;
	}

	.form-input {
		width: 100%;
		padding: 0.6rem 0.75rem;
		font-size: 0.925rem;
		border: 1px solid #d0d0d6;
		border-radius: 6px;
		background: #fff;
		color: #1a1a2e;
		transition: border-color 0.15s, box-shadow 0.15s;
		box-sizing: border-box;
	}

	.form-input:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
	}

	.form-input:disabled {
		background: #f5f5f7;
		color: #999;
	}

	.form-select {
		width: 100%;
		padding: 0.6rem 0.75rem;
		font-size: 0.925rem;
		border: 1px solid #d0d0d6;
		border-radius: 6px;
		background: #fff;
		color: #1a1a2e;
		cursor: pointer;
		box-sizing: border-box;
	}

	.form-select:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
	}

	.form-help {
		font-size: 0.8rem;
		color: #888;
		margin: 0.3rem 0 0;
	}

	.form-help a {
		color: #58a6ff;
		text-decoration: none;
	}

	.form-help a:hover {
		text-decoration: underline;
	}

	/* ── Asset Selector ─────────────────────────────────────────── */
	.asset-selector {
		position: relative;
	}

	.asset-preview-box {
		width: 100%;
		height: 120px;
		border: 1px dashed #d0d0d6;
		border-radius: 6px;
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: #fafafa;
	}

	.asset-preview-img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.asset-preview-placeholder {
		color: #aaa;
		font-size: 0.85rem;
	}

	.asset-selector-actions {
		display: flex;
		gap: 0.5rem;
	}

	.select-btn {
		padding: 0.45rem 0.85rem;
		font-size: 0.825rem;
		font-weight: 500;
		color: #1a1a2e;
		background: #fff;
		border: 1px solid #d0d0d6;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.15s;
	}

	.select-btn:hover {
		background: #f0f0f3;
	}

	.clear-btn {
		padding: 0.45rem 0.85rem;
		font-size: 0.825rem;
		font-weight: 500;
		color: #e5534b;
		background: transparent;
		border: 1px solid #e5534b;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.clear-btn:hover {
		background: #fde8e8;
	}

	/* ── Asset Picker Dropdown ──────────────────────────────────── */
	.picker-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
	}

	.picker-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 50;
		margin-top: 4px;
		background: #fff;
		border: 1px solid #d0d0d6;
		border-radius: 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
		max-height: 280px;
		overflow-y: auto;
		padding: 0.75rem;
	}

	.picker-empty {
		text-align: center;
		padding: 1.5rem 0.5rem;
		color: #888;
		font-size: 0.85rem;
		margin: 0;
	}

	.picker-empty a {
		color: #58a6ff;
	}

	.picker-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
		gap: 0.5rem;
	}

	.picker-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.4rem;
		background: #fafafa;
		border: 2px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		font-family: inherit;
	}

	.picker-item:hover {
		border-color: #58a6ff;
		background: #f0f7ff;
	}

	.picker-item--selected {
		border-color: #1a7f37;
		background: #daf5e0;
	}

	.picker-item img {
		width: 100%;
		height: 60px;
		object-fit: cover;
		border-radius: 3px;
	}

	.picker-item-name {
		font-size: 0.65rem;
		color: #666;
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 80px;
	}

	/* ── Favicon ────────────────────────────────────────────────── */
	.favicon-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.favicon-preview {
		border-radius: 4px;
		border: 1px solid #d0d0d6;
		object-fit: contain;
	}

	.favicon-input {
		font-size: 0.85rem;
	}

	/* ── Section Title ──────────────────────────────────────────── */
	.section-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: #1a1a2e;
		margin: 2rem 0 1rem;
		padding-top: 1.25rem;
		border-top: 1px solid #e0e0e6;
	}

	/* ── Color Picker ───────────────────────────────────────────── */
	.color-picker-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.color-picker {
		width: 40px;
		height: 38px;
		padding: 2px;
		border: 1px solid #d0d0d6;
		border-radius: 6px;
		cursor: pointer;
		background: #fff;
		flex-shrink: 0;
	}

	.color-picker:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
	}

	.color-input {
		flex: 1;
		max-width: 140px;
		font-family: monospace;
		font-size: 0.9rem;
	}

	.color-swatch {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		border: 1px solid #d0d0d6;
		flex-shrink: 0;
	}

	/* ── Theme Preview ──────────────────────────────────────────── */
	.theme-preview {
		padding: 1rem 1.25rem;
		border-radius: 8px;
		border: 1px solid #d0d0d6;
		margin: 1.5rem 0;
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.preview-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.6;
	}

	.preview-text {
		font-size: 0.9rem;
		flex: 1;
	}

	.preview-button {
		padding: 0.4rem 1rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	/* ── Actions ────────────────────────────────────────────────── */
	.form-actions {
		margin-top: 1.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid #e0e0e6;
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.save-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: #fff;
		background: #1a7f37;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.15s, opacity 0.15s;
	}

	.save-btn:hover {
		background: #14682c;
	}

	.save-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.save-btn--draft {
		background: #555;
	}

	.save-btn--draft:hover {
		background: #444;
	}

	.preview-link {
		font-size: 0.875rem;
		font-weight: 500;
		color: #58a6ff;
		text-decoration: none;
		transition: color 0.15s;
	}

	.preview-link:hover {
		color: #388bfd;
		text-decoration: underline;
	}

	/* Simple CSS spinner */
	.spinner {
		display: inline-block;
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ── Responsive ─────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.theme-preview {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>
