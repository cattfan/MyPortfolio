import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(app, "../..");
const require = createRequire(path.join(app, "package.json"));
const next = require.resolve("next/dist/bin/next");
const { projects } = await import("../content/portfolio.ts");
const assets = JSON.parse(
  await readFile(path.join(app, "public/portfolio/assets.json"), "utf8"),
);
const result = spawnSync(process.execPath, [next, "build"], {
  cwd: app,
  env: { ...process.env, PORTFOLIO_EXPORT: "1", NEXT_TELEMETRY_DISABLED: "1" },
  stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status ?? 1);

const site = path.join(workspace, "dist/site");
assert.equal(path.dirname(site), path.join(workspace, "dist"));
await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
const out = path.join(app, "out");
await cp(path.join(out, "_next"), path.join(site, "_next"), {
  recursive: true,
  filter: (source) => !source.endsWith(".map"),
});
for (const file of await readdir(out, { withFileTypes: true })) {
  if (
    file.isFile() &&
    (/\.(html|txt)$/.test(file.name) ||
      ["icon.svg", "favicon.ico"].includes(file.name))
  )
    await cp(path.join(out, file.name), path.join(site, file.name));
}
const allowed = new Set([
  "portfolio/vietnam-boundary.geojson",
  "portfolio/paper-texture.webp",
  "portfolio/reference-wash.webp",
  ...[...assets.maps, ...assets.detailMaps].flatMap((map) =>
    [map.src, map.mobileSrc].map((src) =>
      new URL(src, "http://local").pathname.slice(1),
    ),
  ),
  ...projects.flatMap((project) =>
    project.screenshots.map((image) =>
      new URL(image.src, "http://local").pathname.slice(1),
    ),
  ),
]);
for (const file of allowed) {
  const dest = path.join(site, file);
  await mkdir(path.dirname(dest), { recursive: true });
  await cp(path.join(app, "public", file), dest);
}
// Public attribution contains credits only, without workstation paths, source status or source code hashes.
const credits = {
  map: assets.sources.map(({ name, url, license, licenseUrl, usage }) => ({
    name,
    url,
    license,
    licenseUrl,
    usage,
  })),
  screenshots: [],
};
for (const project of projects) {
  const file =
    project.id === "riviu-web" ? "live-capture.json" : "capture.json";
  const record = JSON.parse(
    await readFile(path.join(app, "public/projects", project.id, file), "utf8"),
  );
  credits.screenshots.push({
    project: project.name,
    mode: project.screenshotSource,
    photos: record.photoSources?.map(
      ({ author, page, license, licenseUrl }) => ({
        author,
        page,
        license,
        licenseUrl,
      }),
    ),
  });
}
await writeFile(path.join(site, "credits.json"), JSON.stringify(credits));
await writeFile(path.join(site, "robots.txt"), "User-agent: *\nDisallow: /\n");
const scripts = new Set();
for (const file of await readdir(site)) {
  if (!file.endsWith(".html")) continue;
  const html = await readFile(path.join(site, file), "utf8");
  for (const match of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  )) {
    if (!/\bsrc\s*=/.test(match[1]) && match[2])
      scripts.add(
        `'sha256-${createHash("sha256").update(match[2]).digest("base64")}'`,
      );
  }
}
const policy = [
  "default-src 'none'",
  `script-src 'self' ${[...scripts].join(" ")}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
  "worker-src 'none'",
];
const config = [
  `add_header Content-Security-Policy "${policy.join("; ")}" always;`,
  'add_header X-Content-Type-Options "nosniff" always;',
  'add_header X-Frame-Options "DENY" always;',
  'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
  'add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;',
];
await mkdir(path.join(workspace, "dist/nginx"), { recursive: true });
await writeFile(
  path.join(workspace, "dist/nginx/security-headers.conf"),
  config.join("\n") + "\n",
);
console.log(
  `STATIC_PASS: ${allowed.size} selected assets; ${scripts.size} inline script hashes; no source maps or capture archives published.`,
);
