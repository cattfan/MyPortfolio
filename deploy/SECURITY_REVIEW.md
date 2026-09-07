# Production security review — 2026-09-08

The review covered the portfolio source, dependency audit, selected public files, Docker runtime, Nginx responses and browser interactions. It did not assess the security of the user's other applications or router.

## Findings addressed

- Dependency audit reported `nanoid` below 3.3.18 plus development-tool advisories in `flatted`, `picomatch` and `@humanfs/node`. Scoped overrides pin patched compatible releases. The full workspace audit now reports zero advisories. Unused ThreeUI/Three.js/UI-package dependencies were removed from the web app.
- Exported production content is served statically. No Next/Node runtime, server actions, API endpoints, database, account system or upload handler is deployed for this portfolio.
- The export includes only active map and project media. Raw capture metadata, workstation paths, detailed elevation manifests, unused project archives, logs, environment files and source maps are excluded from the public output. Credits are preserved in a sanitized `credits.json`.
- CSP allows same-origin resources and explicitly hashed inline bootstrap scripts. It excludes `unsafe-eval`, arbitrary inline scripts, third-party connections, framing and form submissions. Inline styles remain allowed because the map and React animations update styles. This is a documented compatibility decision.
- Responses include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and a restricted `Permissions-Policy`. The server rejects non-GET/HEAD requests and private/source-file paths, with a custom 404 page.
- The container runs as UID/GID 101, with a read-only filesystem, bounded temporary storage, all capabilities dropped, no-new-privileges, health checks and resource/log limits. Runtime image and build image digests are pinned.
- Contact copying supports HTTPS clipboard access and gesture-based copying on the temporary HTTP IP preview. Failure leaves the contact value readable; no exception is left unhandled.

## Verification

- `pnpm audit --json`: zero advisories, including development dependencies.
- Lint and TypeScript: passed.
- Static Docker build on Ubuntu server: passed; healthy Nginx container.
- 58 Playwright checks against the server container through SSH forwarding: passed. Tests cover all four compass directions, both languages, motion, maps, gallery, contact copying, missing assets and HTTP security rules.
- Explicit production console checks at desktop/mobile sizes found no warnings, errors, failed resources or CSP violations in normal tested flows. Deliberately requesting nonexistent URLs still returns a real 404.
- Trivy 0.69.3 scan using its downloaded vulnerability database: zero HIGH/CRITICAL findings in the runtime image. This is a point-in-time scan, not a guarantee against future vulnerabilities.
- Existing Riviu Web and Catt Store services returned HTTP 200 after deployment.

## Deployment state

The container listens on server `192.168.2.5:18088`, published as TCP 18088 and allowed by UFW. The host Nginx virtual host is prepared for `cattfan.site`, `www.cattfan.site` and the supplied public IP on port 80.

On 2026-09-08, the user authorized router access. The Ruijie EG209GS gateway at `192.168.2.1` owns WAN address `113.161.254.76`. A single rule, `CattfanPortfolio`, now forwards **WAN TCP 18088 → 192.168.2.5 TCP 18088**. The rule persisted after reloading the router UI; the external URL returned HTTP 200 with the portfolio and CSP headers. Existing SSH and HTTPS rules were preserved. Public port 80 continues to serve the router; the preview uses `:18088`.

`cattfan.site` has no active A record at review time. Configure DNS and TLS before treating the domain as a production HTTPS endpoint. HTTP does not provide transport encryption. Client-side JavaScript is necessarily visible to visitors; source-map and secret exclusion do not make frontend logic private.
