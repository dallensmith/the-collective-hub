<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	/** Currently uploading? */
	let uploading = $state(false);
	/** Feedback message */
	let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);
	/** ID of the asset being deleted (for confirmation) */
	let deletingId = $state<string | null>(null);
	/** Which asset's URL was just copied */
	let copiedId = $state<string | null>(null);

	// Handle form action feedback
	$effect(() => {
		if (form) {
			if (form.success) {
				feedback = { type: 'success', message: 'Asset deleted.' };
			} else if (form.error) {
				feedback = { type: 'error', message: form.error };
			}
		}
	});

	/** Handle file upload via the API endpoint */
	async function handleUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		feedback = null;

		try {
			const formData = new FormData();
			formData.append('file', file);

			const res = await fetch('/api/assets', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Upload failed.' }));
				feedback = { type: 'error', message: err.message ?? 'Upload failed.' };
			} else {
				feedback = { type: 'success', message: `"${file.name}" uploaded.` };
				// Reload to show the new asset
				window.location.reload();
			}
		} catch {
			feedback = { type: 'error', message: 'Network error during upload.' };
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	/** Copy CDN URL to clipboard */
	async function copyUrl(url: string, id: string) {
		try {
			await navigator.clipboard.writeText(url);
			copiedId = id;
			setTimeout(() => (copiedId = null), 2000);
		} catch {
			feedback = { type: 'error', message: 'Failed to copy URL.' };
		}
	}

	/** Format file size for display */
	function formatSize(bytes: number | null): string {
		if (bytes === null || bytes === undefined) return '—';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	/** Format date for display */
	function formatDate(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Assets — {data.site?.name ?? 'Admin'}</title>
</svelte:head>

<div class="assets-page">
	<h1 class="page-title">Assets</h1>
	<p class="page-desc">Upload and manage images for your site. All uploads are converted to WebP.</p>

	<!-- Feedback -->
	{#if feedback}
		<div
			class="feedback"
			class:feedback--success={feedback.type === 'success'}
			class:feedback--error={feedback.type === 'error'}
			role="alert"
		>
			{feedback.message}
			<button class="feedback-close" onclick={() => (feedback = null)}>×</button>
		</div>
	{/if}

	<!-- Upload Zone -->
	<div class="upload-zone" class:upload-zone--active={uploading}>
		<label class="upload-label">
			{#if uploading}
				<span class="spinner"></span>
				Uploading…
			{:else}
				<span class="upload-icon">+</span>
				<span>Click to upload an image</span>
				<span class="upload-hint">PNG, JPEG, or WebP — max 5MB</span>
			{/if}
			<input
				type="file"
				accept="image/png,image/jpeg,image/webp"
				class="upload-input"
				onchange={handleUpload}
				disabled={uploading}
			/>
		</label>
	</div>

	<!-- Asset Grid -->
	{#if data.assetList.length === 0}
		<div class="empty-state">
			<p>No assets uploaded yet. Click above to add your first image.</p>
		</div>
	{:else}
		<div class="asset-grid">
			{#each data.assetList as asset}
				<div class="asset-card">
					<div class="asset-preview">
						<img
							src={asset.cdnUrl}
							alt={asset.filename}
							loading="lazy"
							width="200"
							height="150"
						/>
					</div>
					<div class="asset-info">
						<span class="asset-name" title={asset.filename}>{asset.filename}</span>
						<span class="asset-meta">{formatSize(asset.size)} · {formatDate(asset.createdAt)}</span>
					</div>
					<div class="asset-actions">
						<button
							class="action-btn action-btn--copy"
							onclick={() => copyUrl(asset.cdnUrl, asset.id)}
							title="Copy CDN URL"
						>
							{copiedId === asset.id ? '✓ Copied' : 'Copy URL'}
						</button>

						{#if deletingId === asset.id}
							<span class="confirm-delete">
								Sure?
								<button
									class="action-btn action-btn--confirm"
									form="delete-form"
									name="assetId"
									value={asset.id}
								>
									Delete
								</button>
								<button
									class="action-btn action-btn--cancel"
									onclick={() => (deletingId = null)}
								>
									Cancel
								</button>
							</span>
						{:else}
							<button
								class="action-btn action-btn--delete"
								onclick={() => (deletingId = asset.id)}
								title="Delete asset"
							>
								Delete
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Hidden form for delete action (so it works without JS too) -->
<form method="POST" action="?/delete" use:enhance id="delete-form" class="hidden-form">
	<input type="hidden" name="assetId" value="" />
</form>

<style>
	.assets-page {
		max-width: 900px;
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

	/* ── Feedback ─────────────────────────────── */
	.feedback {
		padding: 0.7rem 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: space-between;
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
	}

	.feedback-close:hover {
		opacity: 1;
	}

	/* ── Upload Zone ──────────────────────────── */
	.upload-zone {
		border: 2px dashed #d0d0d6;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		margin-bottom: 2rem;
		transition: border-color 0.15s, background 0.15s;
	}

	.upload-zone:hover {
		border-color: #58a6ff;
		background: #f0f7ff;
	}

	.upload-zone--active {
		border-color: #58a6ff;
		background: #f0f7ff;
		opacity: 0.7;
	}

	.upload-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		color: #555;
		font-size: 0.925rem;
	}

	.upload-icon {
		font-size: 2rem;
		color: #58a6ff;
		font-weight: 300;
	}

	.upload-hint {
		font-size: 0.8rem;
		color: #999;
	}

	.upload-input {
		display: none;
	}

	/* ── Spinner ───────────────────────────────── */
	.spinner {
		display: inline-block;
		width: 20px;
		height: 20px;
		border: 2px solid rgba(88, 166, 255, 0.3);
		border-top-color: #58a6ff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ── Empty State ───────────────────────────── */
	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #999;
	}

	/* ── Asset Grid ────────────────────────────── */
	.asset-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1rem;
	}

	.asset-card {
		background: #fff;
		border: 1px solid #e0e0e6;
		border-radius: 8px;
		overflow: hidden;
		transition: box-shadow 0.15s;
	}

	.asset-card:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.asset-preview {
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background: #f5f5f7;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.asset-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.asset-info {
		padding: 0.6rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.asset-name {
		font-size: 0.85rem;
		font-weight: 500;
		color: #1a1a2e;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.asset-meta {
		font-size: 0.75rem;
		color: #888;
	}

	.asset-actions {
		padding: 0 0.75rem 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.action-btn {
		font-size: 0.75rem;
		padding: 0.35rem 0.65rem;
		border-radius: 4px;
		border: 1px solid #d0d0d6;
		background: #fff;
		cursor: pointer;
		transition: background 0.15s;
		font-weight: 500;
	}

	.action-btn--copy {
		color: #1a1a2e;
	}

	.action-btn--copy:hover {
		background: #f0f7ff;
	}

	.action-btn--delete {
		color: #e5534b;
		border-color: #e5534b;
	}

	.action-btn--delete:hover {
		background: #fde8e8;
	}

	.action-btn--confirm {
		color: #fff;
		background: #e5534b;
		border-color: #e5534b;
	}

	.action-btn--cancel {
		color: #555;
	}

	.confirm-delete {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: #e5534b;
	}

	/* Hidden form for progressive enhancement */
	.hidden-form {
		display: none;
	}
</style>
