---
description: 'Use when implementing or modifying CDN storage, image upload, asset management, or URL construction for The Collective Hub. Covers the CDN helper, upload flow, image processing with sharp, and asset library patterns.'
applyTo: 'src/lib/server/cdn.ts', 'src/routes/api/assets/*.ts', 'src/routes/admin/assets/*.svelte'
---

# CDN & Assets

## Architecture

The Collective Hub stores **only CDN keys (paths) in the database**. Full URLs are constructed at render time using the `CDN_BASE_URL` environment variable.

```
Database stores:  "sites/bad-movies-theater/logo.webp"
CDN_BASE_URL:     "https://cdn.example.com"
Full URL:         "https://cdn.example.com/sites/bad-movies-theater/logo.webp"
```

This means:
- **No URL updates needed** if the CDN provider changes — just change `CDN_BASE_URL`
- **No full URLs in the database** — ever
- **CDN migration is trivial** — one env var change

## CDN Path Convention

```
sites/{siteSlug}/{type}/{filename}
```

Examples:
```
sites/bad-movies-theater/logo.webp
sites/bad-movies-theater/background.webp
sites/bad-movies-theater/events/movie-night-june.webp
sites/garbage-day/logo.webp
```

## CDN Helper

See [`src/lib/server/cdn.ts`](src/lib/server/cdn.ts):

```ts
import { env } from '$env/dynamic/private';

const BASE_URL = env.CDN_BASE_URL;

/**
 * Construct a full CDN URL from a key.
 * Returns null if the key is null or empty.
 */
export function cdnUrl(key: string | null): string | null {
    if (!key) return null;
    // Ensure no double slashes
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    return `${BASE_URL}/${cleanKey}`;
}

/**
 * Construct a CDN key for a given site, type, and filename.
 */
export function cdnKey(siteSlug: string, type: string, filename: string): string {
    return `sites/${siteSlug}/${type}/${filename}`;
}
```

## Upload Flow

```
User selects file
    → Client-side validation (type, size)
    → POST to /api/assets/upload (multipart form)
    → Server-side validation
    → sharp converts to webp + optimizes
    → Upload to CDN storage
    → Create asset record in database
    → Return asset URL
```

### Server-Side Upload Handler

```ts
// src/routes/api/assets/+server.ts
import { json } from '@sveltejs/kit';
import sharp from 'sharp';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { assets } from '$lib/server/db/schema';
import { cdnKey } from '$lib/server/cdn';

export async function POST({ locals, request }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('file') as File;

    if (!file) {
        return json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        return json({ error: 'File too large' }, { status: 400 });
    }

    // Convert to webp and optimize
    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
        .webp({ quality: 80, lossless: false })
        .toBuffer();

    // Generate CDN key
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.webp`;
    const key = cdnKey(locals.siteSlug, 'uploads', filename);

    // Upload to CDN (implementation depends on CDN provider)
    // await uploadToCdn(key, webpBuffer, 'image/webp');

    // Create asset record
    const [asset] = await db.insert(assets).values({
        siteId: locals.site.id,
        uploadedByUserId: locals.user.id,
        type: 'image',
        filename: file.name,
        mimeType: 'image/webp',
        size: webpBuffer.length,
        cdnKey: key,
        altText: (form.get('altText') as string) || '',
    }).returning();

    return json({ asset, url: cdnUrl(key) });
}
```

## Image Processing with Sharp

All uploaded images are converted to **webp** format:

```ts
import sharp from 'sharp';

// Convert to webp with quality optimization
const webpBuffer = await sharp(inputBuffer)
    .webp({ quality: 80, lossless: false })
    .toBuffer();

// Resize if needed (e.g., for hero backgrounds)
const resized = await sharp(inputBuffer)
    .resize(1920, 1080, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80 })
    .toBuffer();
```

## Asset Library (Admin)

The assets page in the admin panel allows site owners to:
1. **Browse** all uploaded assets for their site
2. **Upload** new files (drag-and-drop or file picker)
3. **Copy CDN URLs** for use in branding/content settings
4. **Delete** assets (with confirmation)
5. **Edit alt text** for accessibility

```svelte
<!-- Example: Asset grid item -->
<script lang="ts">
    let { asset }: { asset: Asset } = $props();
    let copied = $state(false);

    function copyUrl() {
        navigator.clipboard.writeText(asset.cdnUrl);
        copied = true;
        setTimeout(() => copied = false, 2000);
    }
</script>

<div class="border rounded-lg p-2">
    <img src={asset.cdnUrl} alt={asset.altText} class="w-full h-32 object-cover rounded" />
    <p class="text-xs mt-1 truncate">{asset.filename}</p>
    <button onclick={copyUrl} class="text-xs text-blue-500 mt-1">
        {copied ? 'Copied!' : 'Copy URL'}
    </button>
</div>
```

## Key Rules

1. **Never store full CDN URLs** in the database — only keys
2. **Never hardcode `CDN_BASE_URL`** in code — always use `env.CDN_BASE_URL`
3. **Always validate file types and sizes** on the server — never trust client validation alone
4. **Always convert to webp** for consistent format and smaller files
5. **Always scope assets by `siteId`** in queries
6. **CDN keys must not start with `/`** — the helper handles this, but be consistent
