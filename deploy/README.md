# Production deployment

The site is exported to static HTML/CSS/JavaScript. The runtime image contains Nginx and only the selected public assets, with no Node server, environment files, source maps, capture archives or build tools. Browser JavaScript remains publicly downloadable as with any website.

```sh
docker compose config
docker compose build --pull
PORTFOLIO_PORT=18088 docker compose up -d
curl -I http://127.0.0.1:18088/
```

The container runs as UID/GID 101 with a read-only filesystem, an isolated temporary directory, dropped Linux capabilities, no privilege escalation, resource limits, health checks and bounded logs. Base image digests and the dependency lockfile are pinned. Rebuild and refresh them when applying future patches.

The production URL is **https://cattfan.site/**; `www.cattfan.site` and HTTP redirect to the canonical HTTPS origin. The container binds `127.0.0.1:18088` behind the host Nginx virtual host, so port 18088 is not a public application origin. The older Ruijie `CattfanPortfolio` NAT rule and UFW allowance may remain for rollback history, but the loopback bind prevents them from reaching the container.

`host-nginx.conf` is the dedicated virtual host for `cattfan.site` and `www.cattfan.site`. TLS listens on the host LAN address `192.168.2.5:443`, preserving Tailscale's listener on another address. The HTTP ACME path uses `/var/www/html`; other HTTP requests redirect to HTTPS. The HTTPS proxy explicitly uses HTTP 1.1 upstream so the container can gzip GeoJSON. Validate with `sudo nginx -t` before every reload.

TLS terminates at host Nginx with a Let's Encrypt certificate covering the apex and `www` names. Renewal uses the host's existing Certbot timer and Nginx reload hook. HSTS is intentionally deferred until renewal and HTTPS operation have been observed over time; do not enable preload or `includeSubDomains` without a separate review.

The build generates CSP hashes for Next's static inline bootstrap scripts. No `unsafe-eval` or inline script allowance is used. Inline styles are permitted because the map, animations and React components update styles at runtime. Runtime requests are limited to the same origin. Preview builds default to `PORTFOLIO_INDEXABLE=0` with a noindex metadata directive and robots disallow; verified domain production is built separately with `PORTFOLIO_INDEXABLE=1`. Build-time configuration is baked into static HTML, not changed by a runtime environment variable.

Keep release directories under `<release-root>/`. Each release uses a unique Docker image tag. To roll back, run `docker compose up -d` from the preceding release with its recorded tag, validate the health endpoint and check the public URL. The initial deployment includes an explicit uninstall rollback in its release record.

Application checks:

```sh
pnpm audit
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build:static
PORTFOLIO_URL=http://127.0.0.1:18088 PORTFOLIO_STATIC=1 pnpm --filter web test:e2e
```
