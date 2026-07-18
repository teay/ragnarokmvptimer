# Ragnarok MVP Timer — Lite Build Performance Optimization

---

## Result

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Performance** | 60 | **83** | +23 |
| FCP | 4.7s | **2.0s** | -57% |
| LCP | 6.6s | **4.0s** | -39% |
| CLS | ~0.01 | **0** | perfect |
| TBT | 270ms | **200ms** | -26% |
| Speed Index | 11.7s | **2.0s** | -83% |
| JS chunks | 20 | **5** | -75% |
| Total dist | 21MB | **~8MB** | -62% |
| Modulepreloads | 16 | **2** | -87% |

Tested on: Lighthouse 13.3.0, Moto G Power emulation, Slow 4G throttling

---

## What Was Done

### 1. Compile-Time Lite Mode (`__LITE_MODE__`)

Use `process.env.LITE === 'true'` to define a compile-time constant. Vite tree-shakes dead code at build time.

```ts
// vite.config.ts
define: { __LITE_MODE__: isLite }
```

```bash
npm run build:lite   # Lite build
npm run dev:lite     # Lite dev server
```

This eliminates all visual effects (LuminousParticlesBackground, SparkleEffect, Footer, WelcomeScreen) from the bundle entirely.

### 2. Zero-Glob Asset Resolver

`import.meta.glob` cannot be conditionally excluded — Vite processes ALL glob calls at transform time regardless of `if (__LITE_MODE__)`. Solution: swap the entire `@/utils` module at alias level.

```ts
// vite.config.ts — alias ordering matters (exact match first)
alias: [
  { find: /^@\/utils$/, replacement: './src/utils/index.lite' },
  { find: '@', replacement: './src' },
]
```

`index.lite.ts` has zero globs and uses explicit asset maps + `animatedGifIds`/`animatedApngIds` Sets.

### 3. Lazy Firebase (Saves 247KB Upfront)

Firebase was modulepreloaded in the HTML (246KB raw / 55KB gzip) even though it's only needed for party sharing.

**Fix:** Created `firebaseLazy.ts` — a dynamic import singleton. Removed the `<link rel="modulepreload">` from HTML via postbuild script.

```ts
// services/firebaseLazy.ts
let _app: any;
export async function getFirebase() {
  if (!_app) {
    const { initializeApp } = await import('firebase/app');
    _app = initializeApp(firebaseConfig);
  }
  return _app;
}
```

Result: Firebase chunk loads only when user opens Party Sharing modal.

### 4. HTML Skeleton Placeholder (CLS 0.917 -> 0)

The biggest single improvement. The initial `<div id="root"></div>` was empty — React mounting filled the entire viewport causing massive layout shift (CLS 0.917).

**Fix:** Static HTML skeleton inside `#root` that matches the final layout dimensions (header + 4 cards grid with responsive breakpoints). React overwrites this on mount with near-zero visual shift.

```html
<div id="root">
  <div class="lite-skeleton" id="cls-placeholder">
    <div class="lite-skeleton-header"></div>
    <div class="lite-skeleton-title"></div>
    <div class="lite-skeleton-grid">
      <div class="lite-skeleton-card"></div>
      <!-- ... 4 cards total -->
    </div>
  </div>
</div>
```

### 5. Font Loading: `display=swap` -> `display=optional`

Google Fonts `display=swap` causes text reflow when the web font loads — text renders with system font first, then swaps to Jost, shifting all layout.

**Fix:** Changed to `display=optional` — the browser only uses Jost if it's already cached. No font swap = no CLS from typography. Combined with `media="print" onload` pattern for non-render-blocking loading.

### 6. Server Data via Dynamic Import (15 Chunks -> On-Demand)

In full mode, `import.meta.glob` eagerly bundles all 15 server data JSON files. In lite mode, only the selected server's data is loaded via dynamic import.

```ts
// index.lite.ts
export async function getServerData(server: string) {
  const data = await import(`../data/${server}.json`);
  return data.default;
}
```

Reduced modulepreload count from 16 to 2 (only react-vendor + dayjs).

### 7. Compressed Static Assets

**Maps:** 9.9MB -> 2.4MB via ImageMagick quantize (128 colors lossy, padded to square)

**Icons:** 3.8MB -> 2.0MB via ImageMagick quantize (64 colors lossy)

**Animated icons:** Preserved uncompressed (APNG in `icons/anim/`, GIF in `icons/`)

### 8. Image `width`/`height` Attributes

Added explicit dimensions to `<img>` elements for Map and MvpSprite components. Prevents layout shift when images load.

```tsx
<MapImg src={...} width={512} height={512} />
<Sprite src={...} width={100} height={100} />
```

### 9. Skeleton Width Fix

MvpCardSkeleton was 220px wide but the real MvpCard is 28rem (~448px). Mismatched sizes caused layout shift during skeleton-to-card transition.

```diff
- width: 220px;
+ width: 28rem;
```

### 10. Reduced Skeletons in Lite Mode

64 skeleton cards -> 0 during loading (shows nothing), 8 skeletons only when data is empty. Eliminates skeleton-to-card layout shift during data load.

---

## What Did NOT Help

| Attempt | Result | Why |
|---------|--------|-----|
| CSS `media="print" onload` (non-blocking) | FCP/LCP worse | Browser renders unstyled content, then re-layout when CSS applies — delays LCP |
| `fetch()` for server data | Score dropped to 51 | Adds network round-trip on Slow 4G; bundling is faster for single-page loads |
| dayjs modulepreload removal | No improvement | dayjs is imported everywhere, browser discovers it anyway via main bundle |

---

## Architecture

```
npm run build:lite
  │
  ├─ bash scripts/prepare-lite-maps.sh
  │   ├─ Copy map PNGs to public/maps/
  │   ├─ Copy static icons to public/icons/
  │   ├─ Overlay animated icons (APNG + GIF, uncompressed)
  │   ├─ Quantize maps (128 colors) and static icons (64 colors)
  │   └─ Copy server data JSON to public/data/
  │
  ├─ LITE=true vite build
  │   ├─ __LITE_MODE__ = true (tree-shakes effects)
  │   ├─ @/utils -> index.lite.ts (zero globs)
  │   ├─ manualChunks: react, firebase, dayjs
  │   └─ Dynamic imagetools (skipped in lite)
  │
  └─ bash scripts/postbuild-lite.sh
      └─ Remove firebase modulepreload from dist/index.html
```

---

## Key Files

| File | Role |
|------|------|
| `vite.config.ts` | `__LITE_MODE__` define, alias, manualChunks |
| `src/utils/index.lite.ts` | Zero-glob asset resolver |
| `src/utils/shared.ts` | Shared functions (formatTime, getMvpRespawnTime, etc.) |
| `src/services/firebaseLazy.ts` | Lazy Firebase singleton |
| `index.html` | CLS skeleton, font loading, inline styles |
| `scripts/prepare-lite-maps.sh` | Asset compression pipeline |
| `scripts/postbuild-lite.sh` | HTML post-processing |
