---
description: "Use when adding icons to components or pages for The Collective Hub. Covers @lucide/svelte usage patterns — import, pass, style, and render icons."
applyTo: "src/**/*.svelte", "src/**/*.ts"
---

# Icon Usage

## Overview

This project uses Lucide Icons for all UI iconography:

| Source           | Package                                       | Purpose                                                        |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------- |
| **Lucide Icons** | [`@lucide/svelte`](https://lucide.dev/icons/) | General UI icons (arrows, actions, status, social media, etc.) |

---

## 1. Lucide Icons (`@lucide/svelte`)

### Import Pattern

Import individual icons as named exports from `@lucide/svelte` — there is no centralized icon barrel/index file:

```ts
import { Heart, Menu, X, BookOpen, Video, Star, ThumbsUp } from '@lucide/svelte';
```

Browse the full icon catalog at [lucide.dev/icons](https://lucide.dev/icons/).

> **Note:** There is no `$lib/components/ui/icons` barrel. All icon imports are direct from `@lucide/svelte`. If a centralized re-export pattern is desired in the future, it should be added to `src/lib/icons/` (which does not exist yet) and clearly marked as planned in this document.

### Component Props

Each Lucide icon component accepts these props:

| Prop          | Type     | Default | Description                      |
| ------------- | -------- | ------- | -------------------------------- |
| `size`        | `number` | `24`    | Width & height in pixels         |
| `class`       | `string` | `''`    | Tailwind CSS classes for styling |
| `strokeWidth` | `number` | `2`     | Stroke width of the icon paths   |

### Rendering

Use icons as self-closing components in the template:

```svelte
<Heart size={20} class="text-cyan-400" />
<X size={18} class="text-slate-500 transition-colors hover:text-slate-300" />
<Video size={16} class="text-cyan-300" />
```

### Sizing Conventions

| Context                  | `size` | Example                                         |
| ------------------------ | ------ | ----------------------------------------------- |
| Inline text / badge      | `16`   | `<Heart size={16} class="text-rose-400" />`     |
| Stat card icons          | `20`   | `<Star size={20} class="text-cyan-400" />`      |
| Decorative / empty state | `24`   | `<BookOpen size={24} class="text-slate-600" />` |

### Dynamic Fill (Toggle Icons)

For icons like Hearts that toggle between filled and unfilled, control fill via the `fill-current` Tailwind utility:

```svelte
<Heart size={20} class={isActive ? 'fill-current text-rose-400' : 'text-slate-400'} />
```

The `fill-current` class tells Tailwind to use the current text color as the fill color.

### Passing Icons as Props to Other Components

Components that accept icons expect an **icon component constructor**, not a string. Use Svelte's `Component` type:

```svelte
<script lang="ts">
	import type { Component } from 'svelte';
	import { Heart } from '@lucide/svelte';

	let {
		title,
		value,
		icon = undefined
	} = $props<{
		title: string;
		value: string | number;
		icon?: Component;
	}>();
</script>

{#if icon}
	<svelte:component this={icon} size={20} class="text-cyan-400" />
{/if}
```

At the call site, pass the component constructor (not an instance):

```svelte
<script lang="ts">
	import { Heart } from '@lucide/svelte';
</script>

<StatCard title="Likes" value="42" icon={Heart} />
```

### Dynamic Icons from Dictionaries

For dynamic icon selection (e.g., mapping status to icon), use a `Record<string, Component>`:

```ts
import type { Component } from 'svelte';
import { CheckCircle, XCircle, AlertTriangle } from '@lucide/svelte';

const statusIcons: Record<string, Component> = {
	success: CheckCircle,
	failure: XCircle,
	warning: AlertTriangle
};
```

Then render with `<svelte:component>`:

```svelte
<svelte:component this={statusIcons[status]} size={16} class="text-cyan-400" />
```

---

## 2. Brand Icons (Social Media)

For social media / brand logos (Facebook, Instagram, LinkedIn, YouTube, etc.), use Lucide's brand icons or `simple-icons` package if Lucide doesn't cover them:

```svelte
<!-- For specific brand logos, use simple-icons -->
<script lang="ts">
	import { siFacebook, siInstagram, siLinkedin, siYoutube } from 'simple-icons';
</script>

<!-- Using Lucide for social icons -->
<Globe size={18} class="text-slate-400" />
<Mail size={18} class="text-slate-400" />

<svg viewBox="0 0 24 24" class="h-5 w-5 fill-current text-slate-400">
	<path d={siFacebook.path} />
</svg>
```

---

## 3. Removed Patterns (What NOT To Do)

These patterns should not be used:

### ❌ No `lucide-svelte` package (wrong package name)

```ts
// OLD — DO NOT USE
import { Heart } from 'lucide-svelte';
```

Use `@lucide/svelte` instead:

```ts
// ✅ CORRECT
import { Heart } from '@lucide/svelte';
```

---

## 4. Exceptions

These cases still use `{@html}` legitimately — they are **not** icon-related:

- **JSON-LD structured data injection** (in `<svelte:head>`):
  ```svelte
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
  ```

---

## 5. Guidelines

- Prefer `@lucide/svelte` components for all UI icons
- Use `simple-icons` for brand logos not available in Lucide
- Use `size` prop matching the text size context (16 for small, 20 for default, 24 for large)
- Use `class` for color and styling via Tailwind utilities
