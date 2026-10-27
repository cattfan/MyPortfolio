# Dinh's Portfolio

A bilingual portfolio with an illustrated, scroll-driven journey from Vietnam to Da Lat inside an open sketchbook. Vietnamese is the default; the VI/EN button switches all portfolio copy, controls and map labels and saves an explicit choice locally. Built with Next.js App Router, React, Tailwind CSS and Motion. The book uses DOM/CSS and local raster map layers.

## Development

Run from the workspace root:

```sh
pnpm install --frozen-lockfile
pnpm --filter web dev
```

The default URL is http://localhost:3000. Reuse the existing dev server if it is running for this app. For a separate production preview:

```sh
pnpm --filter web build
pnpm --filter web exec next start --port 3003
```

## Docker production

See [deployment instructions](../../deploy/README.md) and the [security notes](../../deploy/SECURITY.md). `pnpm --filter web build:static` exports and packages only active public assets into `dist/site`, plus hash-based CSP headers. Docker builds the same artifact and serves it with unprivileged Nginx. Native app code, capture archives, source maps and environment files are excluded from the runtime.

The deployment includes a custom favicon/404 page, a social preview image, patched audited dependencies and clipboard support for the canonical HTTPS site at `https://cattfan.site/`. Its four-direction compass uses B/Đ/N/T or N/E/S/W. Host Nginx terminates TLS and proxies to the loopback-only static container.

## Portfolio content

Edit `content/portfolio.ts` for Vietnamese content and `content/translations.ts` for English content. English entries are keyed by id; a missing translation fails the build instead of borrowing another entry's copy. The freelance Software Engineer profile has two years of experience, four personal introduction chapters and two selected projects: Riviu Manager and Riviu Web. The About and experience copy describe how the work gets done in plain language, without an invented career timeline. Riviu Web links to `https://taskscatt.click/`. Project source-code links are not published. Contact details are `dohiendinh.work@gmail.com` and `+84964173913`. The language provider defaults to Vietnamese on the server and when no valid choice exists, updates the document language after a selection and remembers it in `portfolio-language` local storage; both choices work without storage access. Existing explicit English preferences remain respected.

The fixed header stays visible beyond the book section and includes email and phone copy buttons with confirmation or a readable fallback value. On screens up to 760px it is a single row; the section links open from a native `<details>` menu that works without JavaScript and closes on a link, Escape or an outside click. Responsive header heights also set section anchor offsets. Language changes fade visible text out for 120ms and in for 220ms without recreating the book or carousel state. Rapid toggles cancel earlier transitions; reduced-motion users switch immediately.

The portfolio itself has no blog, CMS, signup, backend or form delivery. Project details open in a modal with an animated entrance and exit, preserving document layout and scroll position. A no-JavaScript disclosure remains available in the default Vietnamese page. Each project sits in a browser or app window frame whose title bar also holds the slideshow pause control. Project images slide horizontally after five seconds in view, pause during interaction or while the page is hidden, and respect reduced-motion settings. Previous/next buttons remain inside the enlarged gallery. Clipboard copying requires JavaScript and a browser secure context; email and telephone links remain available. One line in the footer credits the map data and artwork. Local preview does not deploy this portfolio or its linked project publicly.

## Project Screenshots

`public/projects/` contains two active captures for each selected project, with PNG originals, optimized WebP copies and capture provenance. Riviu Web uses `live-overview`, `live-detail` and `live-capture.json`. Riviu Manager WebP copies are 1920x1200; Riviu Web copies are 2880x1800. All originals use a 1440x900 desktop viewport at 2x density. Cards load 1100px-wide `*-card.webp` thumbnails generated from the PNG originals with `pnpm --filter web assets:cards`; the gallery keeps the full-size images. Earlier demo captures and the removed Reports and ShopOfCatt projects remain archived but are not selected by the portfolio content. Screenshots retain their original application language.

Manager uses its existing Tauri mock in the actual Vite frontend. Riviu Web captures visit its public production pages in a fresh browser context and preserve the actual content without fixture responses or DOM changes. This provenance stays in capture metadata rather than repeated labels in the public project cards. No native desktop shell, account workflow or contact submission is exercised.

See [the capture guide](../../scripts/capture/README.md) for prerequisites, commands, local ports and the per-project data setup. The root `note` directory remains read-only reference.

## Book Journey

The title, open book and controls share one full-viewport sticky frame from the first wheel movement. Short laptops, tablets and phones get a compact frame (a tighter intro and a book sized from the remaining height); only viewports under 600px tall, phones under 640px tall and reduced-motion users get normal document flow. The page text inside the book scales with the book through container query units, so smaller books still fit each chapter. The server HTML always retains readable chapters and native project disclosures, including when JavaScript is enabled but its bundle fails. Late hydration keeps an already-open disclosure and does not replace a reading position or a direct section link with the sticky journey; a visitor who arrived mid-page gets the journey once they return to the top. The header is fixed outside that frame and remains visible below the book too. The map zooms with scrolling and blends detail layers; there is no page flip or page-turn asset request. A continuous monotone cubic camera curve in log scale avoids abrupt zoom stops. A chapter selector and previous/next arrows navigate the chapters. Book copy omits technology badges; full project skills remain in the portfolio below. On phones the chapter text sits below the book and the atlas spans both pages. Disabled JavaScript also retains the whole story. Map loading errors preserve the written content.

## Local Assets

`public/portfolio/assets.json` records sources, Mercator projections, exact anchors, the red mainland itinerary and image dimensions. Four chapter maps and two intermediate detail rasters cover Vietnam through Da Lat. The national land outline and islands use the published Government of Viet Nam / OCHA COD-AB 2020 geometry; `vietnam-boundary.geojson` is the locally cached normalized Feature, kept as provenance and not deployed. Natural Earth supplies muted neighboring land and regional hydrography. Da Lat shoreline, streets and buildings use the checked-in OpenStreetMap extract `dalat-osm.json`, including Xuan Huong relation 2390139. Map data is credited in the footer (OpenStreetMap ODbL, OCHA COD-AB CC BY 3.0 IGO, Mapzen terrain tiles, Natural Earth); full provenance remains in the asset metadata and the published `credits.json`. Landmark icons and the dashed itinerary are illustrative, not navigation instructions or maritime boundaries. No random island symbols are drawn.

The national outline, Hanoi-to-Da-Lat red route and geographic labels are drawn in a canvas at constant screen-pixel sizes rather than baked into magnified map images. The canvas loads `vietnam-outline.geojson`: the largest COD-AB polygon, Douglas-Peucker simplified and rounded by `scripts/prepare-outline.mjs` (about 30 KB gzip instead of 246 KB), which also checks that the whole itinerary stays inside it. The route is clipped to that outline, uses short 4px dashes, draws itself from Hanoi to Da Lat when the journey first appears (skipped for reduced motion) and fades out before street-level detail. Pine-colored coastlines and a light route casing remain readable over terrain. Labels use the self-hosted Geist and Source Serif 4 faces, which carry full Vietnamese coverage, and have geographic anchors, staged visibility and overlap checks that also keep them off the book's fold; country and water names do not use city-point symbols. A measured scale bar updates using the Mercator scale and latitude at its position. The Da Lat callout is separate from Ho Chi Minh City. The canvas redraws in Motion's render frame and stops scheduling work at rest. Source Serif 4 is used for the book; font licenses remain beside the self-hosted fonts.

Raster files contain geometry and sourced terrain relief, with 2x overscan (4096x2320 desktop, 2048x1160 mobile); metadata width/height remain the logical 2048x1160 camera plane. Mapzen Terrarium elevation tiles drive height colors and northwest hillshade, clipped to the existing Vietnam land geometry and projected into the exact same camera plane. Tile hashes and source attribution are retained in `terrain-sources.json`; only its compact summary is imported by the client. DEM tiles are cached in the OS temporary directory during preparation, never requested by the browser. Each picture is rendered at 200% size with a -50% offset. This keeps incoming map edges outside the paper during layer blending. The paper grain and annotation mask are fixed in the book, not baked into the moving maps.

Regenerate checked-in assets when deliberately changing the artwork (requires network access to the recorded source datasets):

```sh
pnpm --filter web assets:prepare
# Regenerate only atlas rasters and geographic metadata:
pnpm --filter web exec node scripts/prepare-portfolio-assets.mjs --maps-only
# Rebuild just the runtime outline from the cached boundary:
pnpm --filter web assets:outline
# Project card thumbnails, and the social preview (needs the dev server running):
pnpm --filter web assets:cards
pnpm --filter web assets:og
```

The paper/ink/earth palette (#ece7dc / #2b2721 / #9a6a3e) follows the original ThreeUI Sketchbook reference. The atlas adds jade relief, pale blue sea and distinct lake/forest colors. `reference-wash.webp` is a local, recompressed conversion of its supplied `bg-wash.jpg`. A local book filter preserves the blue/green terrain rather than applying the previous sepia treatment.

The original ThreeUI materials in the root `note` folder are read-only reference. Source fidelity is retained there; the portfolio is a separate adaptation. The wash and the paper crop come from the MIT-licensed [ThreeUI Community repository](https://github.com/MengTo/threeui): keep the notice in [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) and the credit in the site's footer whenever they ship.

## Verification

```sh
pnpm --filter web build
pnpm exec turbo run lint check-types --filter=web
pnpm --filter web exec playwright install chromium
pnpm --filter web test:e2e
```

Tests expect an already-running site at http://localhost:3000. Set `PORTFOLIO_URL` for another address and optionally `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to reuse a locally installed Chromium. Playwright covers focal/scale agreement, constant-width nonblank canvas linework, compact frames on short screens, initial-frame stability, chapter selection, multiple viewport sizes, reduced motion, server HTML, broken images, direct section links, disclosure panels, the mobile menu, social metadata, map credits and clipboard interaction. Test output is ignored in `test-results/`. CI runs the same suite against the production Docker image.

## Shared Skills

The implementation skills are user-level installs in `C:/Users/cattfan/.agents/skills`: `frontend-design`, `vercel-react-best-practices`, `web-design-guidelines`, and `playwright`. No skills are installed in this repository or its `note` folder.
