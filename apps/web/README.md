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

See [deployment instructions](../../deploy/README.md) and the [security review](../../deploy/SECURITY_REVIEW.md). `pnpm --filter web build:static` exports and packages only active public assets into `dist/site`, plus hash-based CSP headers. Docker builds the same artifact and serves it with unprivileged Nginx. Native app code, capture archives, source maps and environment files are excluded from the runtime.

The deployment includes a custom favicon/404 page, patched audited dependencies and clipboard support for a temporary HTTP IP preview. Its four-direction compass uses B/Đ/N/T or N/E/S/W. Public reachability still depends on the upstream router forwarding the selected port to the host.

## Portfolio content

Edit `content/portfolio.ts` for Vietnamese content and `content/translations.ts` for English content. The Software Engineer profile has two years of experience, four personal introduction chapters and two selected projects: Riviu Manager and Riviu Web. The About and experience copy describe working habits and learning in plain language, without a repeated project summary or invented career timeline. Riviu Web links to `https://taskscatt.click/`. Source-code links are not published. Contact details are `dohiendinh.work@gmail.com` and `+84964173913`. The language provider defaults to Vietnamese on the server and when no valid choice exists, updates the document language after a selection and remembers it in `portfolio-language` local storage; both choices work without storage access. Existing explicit English preferences remain respected.

The fixed header stays visible beyond the book section and includes email and phone copy buttons with confirmation or a readable fallback value. Responsive header heights also set section anchor offsets. Language changes fade visible text out for 120ms and in for 220ms without recreating the book or carousel state. Rapid toggles cancel earlier transitions; reduced-motion users switch immediately.

The portfolio itself has no blog, CMS, signup, backend or form delivery. Project details open in a modal with an animated entrance and exit, preserving document layout and scroll position. A no-JavaScript disclosure remains available in the default Vietnamese page. Project images slide horizontally after five seconds in view, pause during interaction or while the page is hidden, and respect reduced-motion settings. Card images have no toolbar, subtitles or counters; previous/next buttons remain inside the enlarged gallery. Clipboard copying requires JavaScript and a browser secure context; email and telephone links remain available. Local preview does not deploy this portfolio or its linked project publicly.

## Project Screenshots

`public/projects/` contains two active captures for each selected project, with PNG originals, optimized WebP copies and capture provenance. Riviu Web uses `live-overview`, `live-detail` and `live-capture.json`. Riviu Manager WebP copies are 1920x1200; Riviu Web copies are 2880x1800. All originals use a 1440x900 desktop viewport at 2x density. Earlier demo captures and the removed Reports and ShopOfCatt projects remain archived but are not selected by the portfolio content. Screenshots retain their original application language.

Manager uses its existing Tauri mock in the actual Vite frontend. Riviu Web captures visit its public production pages in a fresh browser context and preserve the actual content without fixture responses or DOM changes. This provenance stays in capture metadata rather than repeated labels in the public project cards. No native desktop shell, account workflow or contact submission is exercised.

See [the capture guide](../../scripts/capture/README.md) for prerequisites, commands, local ports and the per-project data setup. The root `note` directory remains read-only reference.

## Book Journey

At normal viewport heights, the title, open book and controls share one full-viewport sticky frame from the first wheel movement. The header is fixed outside that frame and remains visible below the book too. The map zooms with scrolling and blends detail layers; there is no page flip, timed animation queue or page-turn asset request. A continuous monotone cubic camera curve in log scale avoids abrupt zoom stops. A chapter selector and previous/next arrows replace the old geographic dot rail. Book copy omits technology badges; full project skills remain in the portfolio below. Reduced-motion and short viewports show the full text in document flow. Disabled JavaScript also retains the whole story. Map loading errors preserve the written content.

## Local Assets

`public/portfolio/assets.json` records sources, Mercator projections, exact anchors, the red mainland itinerary and image dimensions. Four chapter maps and two intermediate detail rasters cover Vietnam through Da Lat. The national land outline and islands use the published Government of Viet Nam / OCHA COD-AB 2020 geometry; `vietnam-boundary.geojson` is the locally cached normalized Feature. Natural Earth supplies muted neighboring land and regional hydrography. Da Lat shoreline, streets and buildings use the checked-in OpenStreetMap extract `dalat-osm.json`, including Xuan Huong relation 2390139. Source/license attribution remains in the asset metadata; the footer credit line is removed. Landmark icons and the dashed itinerary are illustrative, not navigation instructions or maritime boundaries. No random island symbols are drawn.

The national outline, Hanoi-to-Da-Lat red route and geographic labels are drawn in a canvas at constant screen-pixel sizes rather than baked into magnified map images. The route is clipped to the sourced Vietnam polygon, uses short 4px dashes and fades out before street-level detail. Pine-colored coastlines and a light route casing remain readable over terrain. Labels have geographic anchors, staged visibility and overlap checks; country and water names do not use city-point symbols. A measured scale bar updates using the Mercator scale and latitude at its position. The Da Lat callout is separate from Ho Chi Minh City. The canvas redraws through requestAnimationFrame and stops scheduling work at rest. Source Serif 4 is used for the book; font licenses remain beside the self-hosted fonts.

Raster files contain geometry and sourced terrain relief, with 2x overscan (4096x2320 desktop, 2048x1160 mobile); metadata width/height remain the logical 2048x1160 camera plane. Mapzen Terrarium elevation tiles drive height colors and northwest hillshade, clipped to the existing Vietnam land geometry and projected into the exact same camera plane. Tile hashes and source attribution are retained in `terrain-sources.json`; only its compact summary is imported by the client. DEM tiles are cached in the OS temporary directory during preparation, never requested by the browser. Each picture is rendered at 200% size with a -50% offset. This keeps incoming map edges outside the paper during layer blending. The paper grain and annotation mask are fixed in the book, not baked into the moving maps.

Regenerate checked-in assets when deliberately changing the artwork (requires network access to the recorded source datasets):

```sh
pnpm --filter web assets:prepare
# Regenerate only atlas rasters and geographic metadata:
pnpm --filter web exec node scripts/prepare-portfolio-assets.mjs --maps-only
```

The paper/ink/earth palette (#ece7dc / #2b2721 / #9a6a3e) follows the original ThreeUI Sketchbook reference. The atlas adds jade relief, pale blue sea and distinct lake/forest colors. `reference-wash.webp` is a local conversion of its supplied `bg-wash.jpg`. A local book filter preserves the blue/green terrain rather than applying the previous sepia treatment.

The original ThreeUI materials in the root `note` folder are read-only reference. Source fidelity is retained there; the portfolio is a separate adaptation.

## Verification

```sh
pnpm --filter web build
pnpm exec turbo run lint check-types --filter=web
pnpm --filter web exec playwright install chromium
pnpm --filter web test:e2e
```

Tests expect an already-running site at http://localhost:3000. Set `PORTFOLIO_URL` for another address and optionally `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to reuse a locally installed Chromium. Playwright covers focal/scale agreement, constant-width nonblank canvas linework, removal of flips and three-year copy, initial-frame stability, chapter selection, multiple viewport sizes, reduced motion, server HTML, broken images, direct section links, disclosure panels and clipboard interaction. Test output is ignored in `test-results/`.

## Shared Skills

The implementation skills are user-level installs in `C:/Users/cattfan/.agents/skills`: `frontend-design`, `vercel-react-best-practices`, `web-design-guidelines`, and `playwright`. No skills are installed in this repository or its `note` folder.
