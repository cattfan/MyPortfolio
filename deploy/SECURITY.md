# Security notes

The portfolio is a static site. No server-side code, API, database, account system, upload handler or form delivery is deployed.

- **Published files.** `build:static` copies an explicit allowlist of public assets. Source maps, capture archives, provenance manifests, environment files and workstation paths stay out of the output; map and photo credits are published as a sanitized `credits.json`.
- **Headers.** A hash-based Content Security Policy allows only same-origin scripts, styles, images, fonts and connections, with no `unsafe-eval` and no arbitrary inline scripts. Inline styles remain allowed because the map and animations set styles at runtime. Responses also send `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` and a restrictive `Permissions-Policy`.
- **Server.** Unprivileged Nginx (UID/GID 101) on a read-only filesystem with all capabilities dropped, `no-new-privileges`, resource and log limits. It answers GET/HEAD only, returns 404 for dotfiles and source-file extensions, and serves a custom 404 page and `/healthz`.
- **Transport.** The container listens on loopback. The host's Nginx terminates TLS with Let's Encrypt and redirects HTTP and `www` to `https://cattfan.site/`. Both HTTPS hosts send HSTS for one year, without `preload` or `includeSubDomains`.
- **Supply chain.** The lockfile is frozen in builds, vulnerable transitive versions are overridden in `pnpm-workspace.yaml`, base images are pinned by digest, and CI runs lint, type checks, the static build, the Docker image and the Playwright suite against that image.

Client-side JavaScript is visible to every visitor by design; keeping source maps and secrets out of the build does not make frontend logic private.

Please report security issues privately to dohiendinh.work@gmail.com.
