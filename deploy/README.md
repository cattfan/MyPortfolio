# Production deployment

The site is exported to static HTML/CSS/JavaScript and served by unprivileged Nginx. The runtime image contains only the selected public assets: no Node server, environment files, source maps, capture archives or build tools. Browser JavaScript remains publicly downloadable as with any website.

```sh
docker compose config
docker compose build --pull
RELEASE_TAG=<release> docker compose up -d   # binds 127.0.0.1:18088 by default
curl -I http://127.0.0.1:18088/
```

The container runs as UID/GID 101 with a read-only filesystem, an isolated temporary directory, dropped Linux capabilities, no privilege escalation, resource limits, health checks and bounded logs. Base image digests and the dependency lockfile are pinned. Rebuild and refresh them when applying future patches.

`compose.yaml` binds the container to loopback unless `BIND_ADDRESS` says otherwise. In production the host's Nginx (`host-nginx.conf`) is the only public origin: it terminates TLS for `cattfan.site` and `www.cattfan.site`, redirects HTTP and `www` to `https://cattfan.site/`, and proxies to the container over HTTP/1.1 so GeoJSON responses stay gzip-compressed. Set its `listen` address to the host's interface and validate with `sudo nginx -t` before every reload. Do not forward or open the container port in the router or firewall.

TLS certificates come from Let's Encrypt through the host's Certbot timer and ACME webroot. Enable HSTS, without `preload` or `includeSubDomains`, once automatic renewal has succeeded at least once.

The build generates CSP hashes for Next's inline bootstrap scripts; see [SECURITY.md](SECURITY.md). Preview builds default to `PORTFOLIO_INDEXABLE=0`, with noindex metadata and a disallowing `robots.txt`; build the production image with `PORTFOLIO_INDEXABLE=1`. Build-time configuration is baked into the static HTML, not changed by a runtime environment variable.

Each release uses a unique image tag. To roll back, start the previous release's compose project with its recorded tag, then check `/healthz` and the public URL. Keep release records (hosts, paths, tags and verification logs) out of this public repository: the `ops/` folder is git-ignored for that purpose.

Application checks:

```sh
pnpm audit
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build:static
PORTFOLIO_URL=http://127.0.0.1:18088 PORTFOLIO_STATIC=1 pnpm --filter web test:e2e
```
