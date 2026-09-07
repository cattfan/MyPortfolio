import { createRequire } from "node:module";
import { createServer } from "node:http";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  homeData,
  services,
  validateRiviuWebFixture,
} from "./fixtures/riviu-web.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const source =
  process.env.RIVIU_WEB_SOURCE || path.resolve(root, "../Riviu_Web");
const require = createRequire(path.join(root, "apps/web/package.json"));
const { chromium } = require("@playwright/test");
const sharp = require("sharp");
const output = path.join(root, "apps/web/public/projects/riviu-web");
const artifacts = path.join(root, "output/playwright/riviu-web");
const webPort = Number(process.env.RIVIU_CAPTURE_PORT || 3104);
const apiPort = Number(process.env.RIVIU_FIXTURE_PORT || 4104);
const apiUrl = `http://127.0.0.1:${apiPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;

console.log(validateRiviuWebFixture());
if (process.argv.includes("--validate-fixtures")) process.exit(0);

function git(...args) {
  return execFileSync("git", args, {
    cwd: source,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

async function sourceSnapshot() {
  const names = git(
    "ls-files",
    "-z",
    "--cached",
    "--others",
    "--exclude-standard",
  )
    .split("\0")
    .filter(Boolean);
  const hashes = {};
  for (const name of names) {
    hashes[name] = createHash("sha256")
      .update(await readFile(path.join(source, name)))
      .digest("hex");
  }
  return hashes;
}

const before = await sourceSnapshot();
await mkdir(output, { recursive: true });
await mkdir(artifacts, { recursive: true });
const requests = [];
const fixture = createServer((req, res) => {
  requests.push({ method: req.method, path: req.url });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS" || req.url.startsWith("/api/track/")) {
    req.resume();
    res.writeHead(204).end();
    return;
  }
  if (req.method === "GET" && req.url === "/api/content/home") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ data: homeData }));
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      captureFixture: true,
      message: "Use built-in page defaults",
    }),
  );
});

await new Promise((resolve, reject) => {
  fixture.once("error", reject);
  fixture.listen(apiPort, "127.0.0.1", resolve);
});
const log = createWriteStream(path.join(artifacts, "next.log"));
const server = spawn(
  process.execPath,
  [
    path.join(source, "apps/web/node_modules/next/dist/bin/next"),
    "dev",
    "--port",
    String(webPort),
    "--hostname",
    "127.0.0.1",
  ],
  {
    cwd: path.join(source, "apps/web"),
    windowsHide: true,
    env: {
      ...process.env,
      API_URL_INTERNAL: apiUrl,
      NEXT_PUBLIC_API_URL: apiUrl,
      NEXT_PUBLIC_SITE_URL: webUrl,
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_ENV: "development",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
server.stdout.pipe(log);
server.stderr.pipe(log);
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Next exited ${server.exitCode}`);
    try {
      const response = await fetch(webUrl, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Initial compile has not completed. */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error("Local frontend did not become ready");
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : { channel: "chrome" }),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: "vi-VN",
  });
  const blocked = [];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      [webUrl, apiUrl].includes(url.origin) ||
      ["data:", "blob:"].includes(url.protocol)
    )
      return route.continue();
    blocked.push(url.origin + url.pathname);
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const shots = [];
  for (const shot of [
    { id: "overview", route: "/", label: "Trang chu Riviu", selector: null },
    {
      id: "detail",
      route: "/",
      label: "Dich vu va noi dung thuong hieu",
      selector: "#dich-vu",
    },
  ]) {
    const response = await page.goto(webUrl + shot.route, {
      waitUntil: "networkidle",
      timeout: 120000,
    });
    if (response.status() !== 200)
      throw new Error(`Unexpected page status: ${response.status()}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    // Hide the framework developer controls, without changing the product UI.
    await page.addStyleTag({
      content: "nextjs-portal { display: none !important; }",
    });
    if (shot.selector) {
      await page.locator(shot.selector).scrollIntoViewIfNeeded();
      await page.evaluate((selector) => {
        const target = document.querySelector(selector);
        window.scrollTo({
          top: window.scrollY + target.getBoundingClientRect().top - 48,
          behavior: "instant",
        });
      }, shot.selector);
      await page.waitForTimeout(1800);
    }
    await page.mouse.move(-100, -100);
    await page.waitForTimeout(500);
    const imageState = await page
      .locator("img")
      .evaluateAll((images) =>
        images.map((image) => ({
          src: image.getAttribute("src"),
          complete: image.complete,
          width: image.naturalWidth,
        })),
      );
    for (const service of services.slice(0, 2)) {
      if (
        !(await page
          .getByRole("heading", { name: service.title, exact: true })
          .count())
      )
        throw new Error("CMS fixture was not rendered");
    }
    if (imageState.some((image) => image.complete && image.width === 0))
      throw new Error("A source image failed to load");
    const png = path.join(output, `${shot.id}.png`);
    const webp = path.join(output, `${shot.id}.webp`);
    await page.screenshot({ path: png, fullPage: false });
    await sharp(png).webp({ quality: 92, effort: 6 }).toFile(webp);
    const info = await sharp(webp).metadata();
    const statistics = await sharp(webp).stats();
    shots.push({
      ...shot,
      png: `./${shot.id}.png`,
      webp: `./${shot.id}.webp`,
      width: info.width,
      height: info.height,
      sha256: createHash("sha256")
        .update(await readFile(webp))
        .digest("hex"),
      channels: statistics.channels.map(({ stdev }) => stdev),
      scrollY: await page.evaluate(() => window.scrollY),
      images: imageState.length,
    });
    console.log(
      `CAPTURE ${shot.id}: ${info.width}x${info.height}; nonblank=${statistics.channels.some(({ stdev }) => stdev > 5)}`,
    );
  }
  if (errors.length)
    throw new Error(`Browser errors: ${JSON.stringify(errors)}`);
  const after = await sourceSnapshot();
  const changed = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].filter((name) => before[name] !== after[name]);
  await writeFile(
    path.join(output, "capture.json"),
    JSON.stringify(
      {
        project: "Riviu Web",
        repository: "https://github.com/Riviudalat/Riviu_Web",
        sourceCommit: git("rev-parse", "HEAD"),
        sourceStatus: git("status", "--porcelain=v1"),
        sourceChangesDuringCapture: changed,
        capturedAt: new Date().toISOString(),
        viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
        demo: true,
        dataMode:
          "Actual source frontend with six Puck CMS blocks, four photo services and three FAQs from deterministic demo fixtures. Built-in hero network metrics unchanged. Analytics discarded without storage.",
        fixtureRevision: 2,
        fixtureSummary: {
          cmsBlocks: homeData.content.length,
          services: services.length,
          photoAssets: services.map((service) => service.image),
          validation: validateRiviuWebFixture(),
        },
        fontFamilies: "Bricolage Grotesque / Be Vietnam Pro",
        uiModifications:
          "Only Next.js developer controls hidden for capture; no application markup or stylesheet changes.",
        browserErrors: errors,
        blockedRequests: blocked,
        fixtureRequests: requests,
        screenshots: shots,
      },
      null,
      2,
    ) + "\n",
  );
  if (changed.length)
    throw new Error(
      `Source files changed during capture: ${changed.join(", ")}`,
    );
  console.log(
    "RIVIU_WEB_CAPTURE_PASS: two real UI captures; source hashes unchanged; no browser errors.",
  );
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null) {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
        windowsHide: true,
      });
    } else server.kill("SIGTERM");
  }
  await new Promise((resolve) => fixture.close(resolve));
  log.end();
}
