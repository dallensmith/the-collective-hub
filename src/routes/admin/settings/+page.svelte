<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	/** Whether the form is currently being submitted */
	let saving = $state(false);

	/** Feedback message shown after save attempt */
	let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	/** Discord connection status derived from server data */
	let discordStatus = $derived.by(() => {
		if (!data.discordGuildId) return null;
		if (data.discordGuildName) {
			return { type: 'connected' as const, label: `✅ Bot connected: ${data.discordGuildName}` };
		}
		if (data.discordConnectionError) {
			// Check if it's because the token isn't set
			return { type: 'error' as const, label: '❌ Bot not found in server' };
		}
		return { type: 'pending' as const, label: '⏳ Checking…' };
	});

	// Clear feedback when form action data changes (new submission)
	$effect(() => {
		if (form) {
			saving = false;
			if (form.success) {
				if ((form as Record<string, unknown>).draftSaved) {
					feedback = { type: 'success', message: 'Draft saved. Changes are not yet live.' };
				} else if ((form as Record<string, unknown>).published) {
					feedback = { type: 'success', message: 'Settings published and live.' };
				} else if ((form as Record<string, unknown>).draftsDiscarded) {
					feedback = { type: 'success', message: 'Drafts discarded.' };
				} else {
					feedback = { type: 'success', message: 'Settings saved.' };
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
					message: (result.data?.error as string) ?? 'Failed to save settings.'
				};
			} else if (result.type === 'error') {
				feedback = {
					type: 'error',
					message: 'A network error occurred. Please try again.'
				};
			}
		};
	}
</script>

<svelte:head>
	<title>Settings — {data.siteName} — Admin</title>
</svelte:head>

<div class="settings-page">
	<h1 class="page-title">Settings</h1>
	<p class="page-desc">Manage your site's basic identity.</p>

	<!-- Feedback message -->
	{#if feedback}
		<div
			class="feedback"
			class:feedback--success={feedback.type === 'success'}
			class:feedback--error={feedback.type === 'error'}
			role="alert"
		>
			{#if feedback.type === 'success'}
				✓
			{:else}
				⚠
			{/if}
			{feedback.message}
		</div>
	{/if}

	<form method="POST" use:enhance={handleEnhance} class="settings-form">
		<fieldset disabled={saving}>
			<!-- Site Name -->
			<div class="form-group">
				<label for="siteName" class="form-label">
					Site Name <span class="required">*</span>
				</label>
				<input
					type="text"
					id="siteName"
					name="siteName"
					class="form-input"
					value={data.siteName}
					required
					maxlength={100}
					placeholder="My Collective Site"
				/>
				<p class="form-help">The name displayed across your site and in browser tabs.</p>
			</div>

			<!-- Tagline -->
			<div class="form-group">
				<label for="tagline" class="form-label">Tagline</label>
				<input
					type="text"
					id="tagline"
					name="tagline"
					class="form-input"
					value={data.tagline}
					maxlength={200}
					placeholder="A community for…"
				/>
				<p class="form-help">A short description shown beneath your site name. Optional.</p>
			</div>

			<!-- ═══════════════════════════════════════════════════════ -->
			<!-- Discord Events Section -->
			<!-- ═══════════════════════════════════════════════════════ -->
			<div class="section-divider"></div>
			<h2 class="section-title">Discord Events</h2>
			<p class="section-desc">Pull Scheduled Events from your Discord server and display them on the public site. When enabled, Discord events replace native site events.</p>

			<!-- Discord Server ID -->
			<div class="form-group">
				<label for="discordGuildId" class="form-label">
					Discord Server ID
				</label>
				<input
					type="text"
					id="discordGuildId"
					name="discordGuildId"
					class="form-input"
					value={data.discordGuildId}
					maxlength={30}
					placeholder="123456789012345678"
				/>
				<p class="form-help">
					The Discord server (guild) ID to pull events from. Find this in Discord by enabling Developer Mode, then right-click your server icon → "Copy Server ID". The bot must be in your server.
				</p>

				<!-- Discord connection status -->
				{#if discordStatus}
					<div
						class="discord-status"
						class:discord-status--connected={discordStatus.type === 'connected'}
						class:discord-status--error={discordStatus.type === 'error'}
						class:discord-status--pending={discordStatus.type === 'pending'}
					>
						{discordStatus.label}
					</div>
				{/if}
			</div>

			<!-- Enable Discord Events -->
			<div class="form-group">
				<label class="form-label checkbox-label">
					<input type="checkbox" name="discordEventsEnabled" checked={data.discordEventsEnabled} />
					<span>Enable Discord Events</span>
				</label>
				<p class="form-help">
					When enabled, scheduled events from your Discord server replace native site events on the public homepage. The native events manager will be hidden.
				</p>
			</div>

			<!-- Submit -->
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
			</div>
		</fieldset>
	</form>
</div>

<style>
	.settings-page {
		max-width: 560px;
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

	/* ── Section Divider ─────────────────────────────────────────── */
	.section-divider {
		border-top: 1px solid #e0e0e6;
		margin: 1.5rem 0;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a1a2e;
		margin: 0 0 0.25rem;
	}

	.section-desc {
		color: #666;
		margin: 0 0 1.25rem;
		font-size: 0.85rem;
	}

	/* ── Discord Status ──────────────────────────────────────────── */
	.discord-status {
		margin-top: 0.5rem;
		padding: 0.4rem 0.75rem;
		border-radius: 5px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.discord-status--connected {
		background: #daf5e0;
		color: #1a6b30;
		border: 1px solid #a3d9b1;
	}

	.discord-status--error {
		background: #fde8e8;
		color: #9b1c1c;
		border: 1px solid #f4b2b2;
	}

	.discord-status--pending {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
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

	/* ── Form ───────────────────────────────────────────────────── */
	.settings-form fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-label {
		display: block;
		font-weight: 600;
		font-size: 0.875rem;
		margin-bottom: 0.35rem;
		color: #1a1a2e;
	}

	.required {
		color: #e5534b;
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

	.form-help {
		font-size: 0.8rem;
		color: #888;
		margin: 0.3rem 0 0;
	}

	/* ── Checkbox ───────────────────────────────────────────────── */
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox-label input[type='checkbox'] {
		width: 16px;
		height: 16px;
	}

	/* ── Actions ────────────────────────────────────────────────── */
	.form-actions {
		margin-top: 1.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid #e0e0e6;
		display: flex;
		align-items: center;
		gap: 0.75rem;
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
</style>
