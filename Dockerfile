# syntax=docker/dockerfile:1
FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json
RUN --mount=type=cache,id=cattfan-pnpm,target=/pnpm/store pnpm install --filter web... --frozen-lockfile --ignore-scripts --store-dir=/pnpm/store
COPY apps/web ./apps/web
RUN pnpm --filter web build:static

FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:442753882674b49ae2c1de83ed67896131c0777f56df5005e356e62bc3f7e7ce AS runtime
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/nginx/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist/site /usr/share/nginx/html
USER 101:101
EXPOSE 8080
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
