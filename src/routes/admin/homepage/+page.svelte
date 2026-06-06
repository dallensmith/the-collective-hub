<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	/** Whether the form is currently being submitted */
	let saving = $state(false);

	/** Feedback message shown after save attempt */
	let feedback = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	// Clear feedback when form action data changes (new submission)
	$effect(() => {
		if (form) {
			saving = false;
			if (form.success) {
				feedback = { type: 'success', message: 'Homepage settings saved.' };
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
					message: (result.data?.error as string) ?? 'Failed to save homepage settings.'
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
	<title>Homepage — Admin</title>
</svelte:head>

<div class="homepage-page">
	<h1 class="page-title">Homepage</h1>
	<p class="page-desc">Customize your public homepage hero section, about text, and call-to-action button.</p>

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

	<form method="POST" use:enhance={handleEnhance} class="homepage-form">
		<fieldset disabled={saving}>
			<!-- Hero Title -->
			<div class="form-group">
				<label for="heroTitle" class="form-label">Hero Title</label>
				<input
					type="text"
					id="heroTitle"
					name="heroTitle"
					class="form-input"
					value={data.heroTitle}
					maxlength={100}
					placeholder="Welcome to Our Community"
				/>
				<p class="form-help">The main headline displayed in the hero section. Max 100 characters.</p>
			</div>

			<!-- Hero Subtitle -->
			<div class="form-group">
				<label for="heroSubtitle" class="form-label">Hero Subtitle</label>
				<input
					type="text"
					id="heroSubtitle"
					name="heroSubtitle"
					class="form-input"
					value={data.heroSubtitle}
					maxlength={200}
					placeholder="A community for creators, gamers, and builders."
				/>
				<p class="form-help">Supporting text shown below the hero title. Max 200 characters.</p>
			</div>

			<!-- About Text -->
			<div class="form-group">
				<label for="aboutText" class="form-label">About Text</label>
				<textarea
					id="aboutText"
					name="aboutText"
					class="form-textarea"
					value={data.aboutText}
					maxlength={2000}
					rows={6}
					placeholder="Tell visitors what your community is about. This text appears in the About section beneath the hero. You can describe your mission, values, or what new members can expect."
				></textarea>
				<p class="form-help">A longer description of your community. Max 2000 characters. Leave empty to hide the About section.</p>
			</div>

			<!-- Section Divider: CTA -->
			<h2 class="section-title">Call-to-Action Button</h2>

			<!-- Primary Button Text -->
			<div class="form-group">
				<label for="primaryButtonText" class="form-label">Button Text</label>
				<input
					type="text"
					id="primaryButtonText"
					name="primaryButtonText"
					class="form-input"
					value={data.primaryButtonText}
					maxlength={50}
					placeholder="Join Discord"
				/>
				<p class="form-help">The label on the primary action button (e.g. "Join Discord", "Learn More"). Max 50 chars.</p>
			</div>

			<!-- Primary Button Link -->
			<div class="form-group">
				<label for="primaryButtonLink" class="form-label">Button Link</label>
				<input
					type="text"
					id="primaryButtonLink"
					name="primaryButtonLink"
					class="form-input"
					value={data.primaryButtonLink}
					placeholder="https://discord.gg/..."
				/>
				<p class="form-help">
					The URL the button links to. Must start with <code>http://</code>, <code>https://</code>, or <code>/</code> for internal paths.
				</p>
			</div>

			<!-- Section Divider: Toggles -->
			<h2 class="section-title">Page Sections</h2>

			<!-- Show Next Event -->
			<div class="form-group checkbox-group">
				<label class="form-label checkbox-label">
					<input
						type="checkbox"
						id="showNextEvent"
						name="showNextEvent"
						checked={data.showNextEvent}
						class="form-checkbox"
					/>
					<span>Show Next Event Section</span>
				</label>
				<p class="form-help">Display the upcoming event section on the homepage.</p>
			</div>

			<!-- Show Schedule -->
			<div class="form-group checkbox-group">
				<label class="form-label checkbox-label">
					<input
						type="checkbox"
						id="showSchedule"
						name="showSchedule"
						checked={data.showSchedule}
						class="form-checkbox"
					/>
					<span>Show Schedule Section</span>
				</label>
				<p class="form-help">Display the event schedule section on the homepage.</p>
			</div>

			<!-- Actions -->
			<div class="form-actions">
				<button type="submit" class="save-btn" disabled={saving}>
					{#if saving}
						<span class="spinner"></span>
						Saving…
					{:else}
						Save Homepage
					{/if}
				</button>

				<a href="/" class="preview-link" target="_blank" rel="noopener noreferrer">
					↗ View Site
				</a>
			</div>
		</fieldset>
	</form>
</div>

<style>
	.homepage-page {
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
	.homepage-form fieldset {
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

	.form-textarea {
		width: 100%;
		padding: 0.6rem 0.75rem;
		font-size: 0.925rem;
		font-family: inherit;
		border: 1px solid #d0d0d6;
		border-radius: 6px;
		background: #fff;
		color: #1a1a2e;
		transition: border-color 0.15s, box-shadow 0.15s;
		box-sizing: border-box;
		resize: vertical;
		line-height: 1.6;
	}

	.form-textarea:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
	}

	.form-textarea:disabled {
		background: #f5f5f7;
		color: #999;
	}

	.form-help {
		font-size: 0.8rem;
		color: #888;
		margin: 0.3rem 0 0;
	}

	.form-help code {
		background: #f0f0f3;
		padding: 0.1em 0.35em;
		border-radius: 3px;
		font-size: 0.85em;
	}

	/* ── Checkbox ────────────────────────────────────────────────── */
	.checkbox-group {
		margin-bottom: 1.25rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.form-checkbox {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: #1a7f37;
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
</style>
