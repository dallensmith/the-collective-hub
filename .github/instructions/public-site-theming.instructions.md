---
description: 'Use when building or modifying the public-facing landing page for The Collective Hub. Covers SSR-only rendering, section structure, CSS custom properties for theming, theme presets, and dynamic branding from settings.'
applyTo: 'src/routes/+page.svelte', 'src/routes/+layout.svelte', 'src/routes/layout.css', 'src/routes/+page.server.ts'
---

# Public Site & Theming

## Architecture

The public site is a **single SSR-only landing page**. There is no client-side routing beyond the initial page load, no SPA navigation, and no JavaScript-driven content switching.

```
Single page structure:
    Hero → About → Events → Social Links → Footer
```

## Section Structure

The page is composed of clearly separated sections:

```svelte
<!-- src/routes/+page.svelte (conceptual) -->
<script lang="ts">
    let { data } = $props();
    let { settings } = data;
</script>

<Hero {settings} />
<About {settings} />
<Events {settings} />
<SocialLinks {settings} />
<Footer {settings} />
```

Each section is a Svelte component in `src/lib/components/` (for the public site) or defined locally in the route if it's too specific.

## Data Loading

The homepage data is loaded in `+page.server.ts`:

```ts
// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const settings = locals.siteSettings;

    // Optionally load events, nav links, etc.
    // const events = await loadEvents(locals.site.id);

    return {
        settings,
        // events,
    };
};
```

## Theme System

The site uses **CSS custom properties** generated from the site's theme settings. These are applied to the HTML element and cascade through all components.

### Theme Settings Shape

```typescript
interface ThemeSettings {
    preset: 'dark' | 'light' | 'custom';
    accentColor: string;     // e.g., "#e63946"
    backgroundColor: string; // e.g., "#1a1a2e"
    textColor: string;       // e.g., "#eaeaea"
}
```

### Applying Theme in Layout

In [`src/routes/+layout.svelte`](src/routes/+layout.svelte) or the root layout, apply theme as inline styles:

```svelte
<script lang="ts">
    let { data, children } = $props();
    let theme = $derived(data.settings?.theme ?? { preset: 'dark', accentColor: '#e63946', backgroundColor: '#1a1a2e', textColor: '#eaeaea' });
</script>

<div
    style="--accent: {theme.accentColor}; --bg: {theme.backgroundColor}; --text: {theme.textColor};"
    class="min-h-screen"
    style="background-color: var(--bg); color: var(--text);"
>
    {@render children()}
</div>
```

### Theme Presets

Built-in presets provide sensible defaults:

| Preset | Background | Text | Accent | Vibe |
|--------|-----------|------|--------|------|
| `dark` (default) | `#1a1a2e` | `#eaeaea` | `#e63946` | Cinematic, theater-like |
| `light` | `#ffffff` | `#1a1a2e` | `#e63946` | Clean, readable |
| `custom` | Per-site config | Per-site config | Per-site config | Fully customized |

## Dynamic Branding

Branding settings control the visual identity:

### Logo

```svelte
<script lang="ts">
    let { branding }: { branding: BrandingSettings } = $props();
    let logoSrc = $derived(branding.logoCdnKey ? cdnUrl(branding.logoCdnKey) : null);
</script>

{#if logoSrc}
    <img src={logoSrc} alt="{branding.siteName} logo" class="h-12 w-auto" />
{:else}
    <h1 class="text-2xl font-bold">{branding.siteName}</h1>
{/if}
```

### Favicon

Set in [`src/app.html`](src/app.html) via the loaded settings:

```html
<link rel="icon" href="{faviconUrl || '/favicon.png'}" />
```

## Section Components

### Hero Section

```svelte
<script lang="ts">
    let { settings }: { settings: SiteSettingsData } = $props();
    let { homepage, branding } = settings;
</script>

<section class="py-20 text-center">
    <h1 class="text-4xl md:text-6xl font-bold" style="color: var(--accent)">
        {homepage.heroTitle || branding.siteName}
    </h1>
    <p class="mt-4 text-lg">{homepage.heroSubtitle || branding.tagline}</p>
    {#if homepage.primaryButtonLink}
        <a
            href={homepage.primaryButtonLink}
            class="mt-8 inline-block px-6 py-3 rounded-lg font-semibold"
            style="background-color: var(--accent); color: white;"
        >
            {homepage.primaryButtonText || 'Join Us'}
        </a>
    {/if}
</section>
```

### About Section

Displays the `homepage.aboutText` content. Supports markdown rendering for basic formatting.

### Events Section

Shows upcoming events if `homepage.showNextEvent` or `homepage.showSchedule` is enabled. Events are loaded server-side and passed through `data`.

### Social Links Section

Renders social platform links from the `socialLinks` table with platform-appropriate icons.

## CSS Custom Properties Reference

```css
/* Defined at runtime via inline styles on the root element */
:root {
    --accent: #e63946;       /* Primary accent color */
    --bg: #1a1a2e;           /* Page background */
    --text: #eaeaea;         /* Text color */
    --accent-hover: #ff6b6b; /* Optional: accent hover state */
}
```

Use these in components instead of hardcoding colors:

```css
/* ✅ */
.button {
    background-color: var(--accent);
    color: white;
}

/* ❌ */
.button {
    background-color: #e63946;
    color: white;
}
```

## Rendering Rules

1. **SSR-only**: All content is rendered on the server. No client-side data fetching for page content.
2. **No JavaScript required**: The public page should be fully functional without JS (links, text, images).
3. **Theme-first**: Always use CSS custom properties for colors. Never hardcode theme colors.
4. **Responsive**: The single layout must work on mobile and desktop.
5. **Accessible**: Proper heading hierarchy, alt text on images, sufficient color contrast.
