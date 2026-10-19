# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Bilingual personal portfolio for Đỗ Hiền Dinh (Vietnamese by default, English toggle), live at https://cattfan.site/. A pnpm + Turborepo monorepo whose only app is `apps/web`: a single-page Next.js 16 App Router site (React 19, Motion, d3-geo), exported to static files and served by unprivileged Nginx in Docker. There is no backend, API, CMS or form handling. `packages/eslint-config` and `packages/typescript-config` hold the shared configs.

Next.js 16 has breaking changes from older versions — check the bundled docs in `apps/web/node_modules/next/dist/docs/` before using Next APIs. (`next dev` maintains `apps/web/AGENTS.md` and `apps/web/CLAUDE.md` with that same warning; keep repo guidance here.)

Styling is CSS Modules (one per component) plus design tokens as CSS variables in `app/globals.css`; Tailwind 4 is imported but its utility classes are not used.

## Commands

Requires Node 24+ and pnpm 11.25.0. Run from the repo root.

```sh
pnpm install --frozen-lockfile
pnpm --filter web dev            # http://localhost:3000 (reuse it if one is already running)
pnpm --filter web lint           # --max-warnings 0 + eslint-plugin-only-warn: any finding fails
pnpm --filter web check-types    # next typegen && tsc --noEmit — don't run bare tsc (needs generated .next/types)
pnpm --filter web build:static   # production artifact → <repo>/dist/site + dist/nginx/security-headers.conf
```

Prettier is not enforced and several files (including generated `next-env.d.ts`) differ from its output — format only the files you touch (`pnpm exec prettier --write <files>`), not the repo-wide `pnpm format`.

Playwright is the only test framework. The config has no `webServer`: start the site first; tests run serially against `PORTFOLIO_URL` (default `http://localhost:3000`). `PLAYWRIGHT_CHROMIUM_EXECUTABLE` reuses a local Chromium.

```sh
pnpm --filter web exec playwright install chromium
pnpm --filter web test:e2e
pnpm --filter web exec playwright test tests/polish.spec.ts -g "header stays"   # one file / title filter
```

Specs that need the real Nginx runtime (security headers/CSP, 404/405 rules, GeoJSON MIME/gzip) are skipped unless `PORTFOLIO_STATIC=1`:

```sh
docker compose build && docker compose up -d     # binds http://127.0.0.1:18088 by default
PORTFOLIO_URL=http://127.0.0.1:18088 PORTFOLIO_STATIC=1 pnpm --filter web test:e2e
```

CI (`.github/workflows/ci.yml`) runs lint, type checks, the Docker build and that static suite on every push to `main` and every pull request.

## Architecture

### Content and language

- `apps/web/content/portfolio.ts` is the Vietnamese source of truth (profile, four journey chapters, projects, tech stack, experience) and defines the `Project` type.
- `content/translations.ts` builds English by spreading the Vietnamese objects with copy keyed by `id`; a missing English entry throws, which fails the build. Map label names are in `mapNames`.
- Components get localized data via `useLanguage().content` and inline UI strings via `t("tiếng Việt", "English")` (`components/language-provider.tsx`).
- Server HTML is always Vietnamese. The choice persists in localStorage `portfolio-language` and must work when storage throws. Switching fades visible text without remounting the book or carousels; `data-language-static` opts an element out of the fade.
- `app/page.tsx` is a server component (it owns the `robots` metadata so the 404 page keeps only Next's noindex) that renders the client `components/home.tsx`.

### Progressive enhancement

The prerendered HTML is the fallback and must stay usable with JavaScript disabled or failing to load: all chapters in normal flow, native `<details>` for project details, plain image links, `mailto:`/`tel:` links, and a `<details>` menu for the mobile header. JS-only controls render `disabled={!hydrated}`.

- `BookJourney` upgrades to the sticky scroll journey when `useInitialEnhancementEligibility()` allows it (no URL hash, `scrollY < 2`, nothing focused — or later, once a visitor who arrived mid-page scrolls back to the top with no disclosure open) and `staticQuery` (reduced motion, viewports under 600px tall, phones under 640px tall) does not match. Exposed as `data-enhanced` / `data-static` / `data-chapter`.
- `staticQuery` in `book-journey.tsx` mirrors the normal-flow media queries at the end of `book-journey.module.css` — change both together. Shorter laptops, tablets and phones use the compact sticky frames defined just above them.
- Text inside the book scales with the book via container query units (`.paper` is an inline-size container), so compact books still fit their chapters.
- `ProjectShowcase` swaps its fallback for dialog-based gallery/details only if the visitor has not already opened or focused the fallback.

### Map journey

- `public/portfolio/assets.json` is generated (don't hand-edit): four chapter maps + two intermediate detail rasters, all north-up Mercator plates sharing one anchor (Da Lat), plus labels, the itinerary, the runtime `outline` and source attributions.
- `lib/book-camera.ts` maps scroll progress → camera pose (log-scale monotone cubic interpolation through `CHAPTER_STOPS`); `getPlateTransform` keeps the anchor fixed on every plate; `getChapter` derives the active chapter.
- `BookJourney` requests a layer only once the camera scale nears it; `GeographicPlate` fades it in after `decode()` succeeds.
- `MapLinework` draws at constant pixel size on two canvases: `[data-map-linework]` holds the outline (`vietnam-outline.geojson`), labels and scale bar plus all the `data-*` test hooks; `[data-map-route]`, beneath it, holds the dashed route, which draws itself from Hanoi on first appearance (skipped for reduced motion). The intro redraws only the route canvas — keep per-frame work there cheap. Labels use the site's Geist/Source Serif 4 faces read from the `--font-geist-sans`/`--font-book` variables (system fonts lack Vietnamese glyphs) and avoid the compass, pin, scale bar and the book's fold (`data-gutter`) without straying more than 48px from their point. Both canvases draw in Motion's `frame.render` — not a separate `requestAnimationFrame` — so they stay in the same frame as the plate transforms; test hooks are written only when they change.
- On phones the left page has no chapter text, so the map mask is removed and labels may use both pages.
- The static-mode pin position in `book-journey.module.css` (`top: 73.4579%; left: 64.9136%`) is hard-coded from `maps[0].anchor`.

### Static build and deployment

`apps/web/scripts/build-static.mjs` runs `next build` with `PORTFOLIO_EXPORT=1` (switches `next.config.js` to `output: "export"`), then:

- Copies `public/` files from an **allowlist** only: CV PDFs, the runtime outline, `paper-texture.webp`, `reference-wash.webp`, every map in `assets.json`, and every screenshot plus its `card` thumbnail referenced by `content/portfolio.ts`. Any other new public file 404s in production unless added. The full `vietnam-boundary.geojson` and archived captures are excluded on purpose.
- Copies the root HTML/TXT exports, icons and `opengraph-image.jpg`; writes `credits.json` from `public/projects/<id>/capture.json` (`live-capture.json` for `riviu-web`; a missing file fails the build) and `robots.txt`.
- Hashes Next's inline scripts into a same-origin CSP in `dist/nginx/security-headers.conf` (`default-src 'none'`, no `unsafe-eval`, images/fonts/connect from self only — no CDNs, external fonts/images or third-party requests).
- Imports `content/portfolio.ts` via Node's type stripping (as do `scripts/prepare-resume.py` and the asset scripts), so keep that file free of imports and of non-erasable TS (enums, namespaces).

`PORTFOLIO_INDEXABLE=1` is only for the production-domain build (default builds are noindex); `app/page.tsx` and `build-static.mjs` read it. Any new env var read by code must be listed in `turbo.json` `globalEnv` or the `turbo/no-undeclared-env-vars` lint rule fails.

The Dockerfile builds `build:static` and serves `dist/site` with `deploy/nginx.conf` (GET/HEAD only, 404 for dotfiles/source extensions, `/healthz`, `.geojson` as `application/geo+json` so it gzips). `compose.yaml` binds to loopback by default; production sits behind host Nginx (`deploy/host-nginx.conf`) terminating TLS for cattfan.site. Release records (hosts, paths, evidence) belong in the git-ignored `ops/` folder, not in the public repo.

### Tests

- `portfolio.spec.ts` forces Vietnamese in `beforeEach` unless the test title starts with `language:`; `showcase.spec.ts` covers the window frames/thumbnails, social metadata, colophon credits, mobile menu and the mid-page upgrade.
- Tests locate elements by Vietnamese accessible names and by `data-*` hooks (`data-enhanced`/`data-static`/`data-chapter`, `data-layer`/`data-ready`, `data-carousel`/`data-slide-index`/`data-autoplay`, `data-window`, dialog `data-phase`, `data-language-toggle`, `data-header-copy`, `data-reveal`, canvas `data-labels`/`data-label-boxes`/`data-scale-*`) — treat them as test API.
- Tests also pin content decisions: exactly two projects, "2 năm kinh nghiệm", one map request on cold load, absence of removed copy (Riviu Reports, ShopOfCatt, project source links), exactly one OpenStreetMap credit link (in the colophon, never inside the book), and the colophon's ThreeUI (MIT) credit for `reference-wash.webp`/`paper-texture.webp`, whose license notice lives in `THIRD_PARTY_NOTICES.md` — change them deliberately alongside content.

## Changing a project

A project is spread across several places; touch them together:

1. `content/portfolio.ts` — Vietnamese copy, screenshot `src`/`card`/`width`/`height`.
2. `content/translations.ts` — English copy keyed by the project `id`.
3. `public/projects/<id>/` — screenshots and capture metadata (produced by `scripts/capture/`, see its README), then `pnpm --filter web assets:cards` for the 1100px card thumbnails.
4. `next.config.js` `images.localPatterns` — Next 16 rejects local image URLs whose query string (e.g. `?v=20260907-2`) isn't listed; bump the revision in both places when recapturing.
5. The CV: `scripts/prepare-resume.py` hard-codes per-project CV copy; regenerate both PDFs (`scripts/ASSETS.md`).
6. Tests that assert project count or copy.

## Generated assets and local folders

- `pnpm --filter web assets:prepare` regenerates map rasters, `assets.json`, the boundary and runtime outline, paper texture and Newsreader fonts from the recorded sources (network required; downloads cached in the OS temp dir). `assets:outline` rebuilds only the outline from the cached boundary; `assets:cards` the project thumbnails; `assets:og` the social preview `app/opengraph-image.jpg` (needs the dev server running).
- Python tooling (`pip install -r scripts/requirements-assets.txt`, ideally in a virtualenv): `prepare-web-fonts.py` (WOFF2 subsets covering Latin/Vietnamese/punctuation/arrows only — other glyphs fall back to system fonts), `prepare-resume.py` (CV PDFs), `package-deployment.py` (source tarball).
- Gitignored local folders: `dist/` (build output), `output/` (audit/release evidence), `ops/` (deployment records and reports), `tmp/`, and `note/` (read-only ThreeUI reference material).
