# Production deployment

The site is exported to static HTML/CSS/JavaScript. The runtime image contains Nginx and only the selected public assets, with no Node server, environment files, source maps, capture archives or build tools. Browser JavaScript remains publicly downloadable as with any website.

```sh
docker compose config
docker compose build --pull
PORTFOLIO_PORT=18088 docker compose up -d
curl -I http://127.0.0.1:18088/
```

The container runs as UID/GID 101 with a read-only filesystem, an isolated temporary directory, dropped Linux capabilities, no privilege escalation, resource limits, health checks and bounded logs. Base image digests and the dependency lockfile are pinned. Rebuild and refresh them when applying future patches.

The public preview is available at **http://113.161.254.76:18088/**. The container binds `0.0.0.0:18088`; UFW allows TCP 18088. On the Ruijie EG209GS gateway, `CattfanPortfolio` forwards WAN TCP 18088 to `192.168.2.5:18088`. The rule was confirmed after reloading the router UI and the public URL returned HTTP 200. Existing SSH and HTTPS forwarding rules were preserved. To remove this exposure, delete only `CattfanPortfolio` under Gateway → Config → Advanced → NAT Rule → Port Mapping.

The host also has `host-nginx.conf` as a separate virtual host for `113.161.254.76`, `cattfan.site` and `www.cattfan.site` on port 80. Public port 80 currently belongs to the router, so the IP preview uses `:18088`. Validate with `sudo nginx -t` before reloading host configuration.

The IP preview uses HTTP while DNS is inactive. Clipboard copying includes a user-gesture fallback for this environment. After pointing DNS at the server, provision a valid TLS certificate for the domain and redirect its HTTP traffic to HTTPS. Do not enable HSTS or upgrade-insecure-requests on the temporary HTTP preview.

The build generates CSP hashes for Next's static inline bootstrap scripts. No `unsafe-eval` or inline script allowance is used. Inline styles are permitted because the map, animations and React components update styles at runtime. Runtime requests are limited to the same origin. The preview currently disallows indexing in robots.txt.

Keep release directories under `/home/riviu/apps/cattfan-portfolio/releases/`. Each release uses a unique Docker image tag. To roll back, run `docker compose up -d` from the preceding release with its recorded tag, validate the health endpoint and check the public URL. The initial deployment includes an explicit uninstall rollback in its release record.

Application checks:

```sh
pnpm audit
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build:static
PORTFOLIO_URL=http://127.0.0.1:18088 PORTFOLIO_STATIC=1 pnpm --filter web test:e2e
```
