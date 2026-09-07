import { createRequire } from "node:module";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import {
  buildProducts,
  exchangeRate,
  productsFixture,
  productArtwork,
  validateProducts,
} from "./fixtures/shop-products.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const source = process.env.SHOP_SOURCE || "C:/Users/cattfan/Desktop/ShopOfCatt";
const require = createRequire(path.join(root, "apps/web/package.json"));
const { chromium } = require("@playwright/test");
const sharp = require("sharp");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const icons = require("lucide-react");
const sourceRequire = createRequire(path.join(source, "apps/web/package.json"));
const { createDefaultStorefrontDocument } = sourceRequire("@webcatt/shared");
const output = path.join(root, "apps/web/public/projects/shop-of-catt");
const git = (args) => {
  const result = spawnSync("git", ["-C", source, ...args], {
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};
const apiPort = 4105;
const webPort = 3105;
const api = `http://127.0.0.1:${apiPort}/api`;
const stats = validateProducts(buildProducts(api));
console.log(
  `SHOP_FIXTURES_PASS: ${stats.products} products; ${stats.variants} variants; stock=${stats.stock}; sold=${stats.sold}; all totals and VND prices agree.`,
);
if (process.argv.includes("--validate-fixtures")) process.exit(0);

async function sourceSnapshot() {
  const files = git([
    "ls-files",
    "-z",
    "--cached",
    "--others",
    "--exclude-standard",
  ])
    .split("\0")
    .filter(Boolean);
  const hashes = {};
  for (const file of files) {
    const target = path.join(source, file);
    if (!(await fs.stat(target)).isFile()) continue;
    hashes[file] = createHash("sha256")
      .update(await fs.readFile(target))
      .digest("hex");
  }
  return {
    status: git(["status", "--porcelain"]),
    commit: git(["rev-parse", "HEAD"]).trim(),
    hashes,
  };
}

const before = await sourceSnapshot();
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    "C:/Users/cattfan/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe",
});
let child;
let fixture;
let logs = "";
try {
  const artContext = await browser.newContext({
    viewport: { width: 960, height: 720 },
    deviceScaleFactor: 1,
  });
  const artPage = await artContext.newPage();
  const art = [];
  const artworkChecks = [];
  const icon = (name) => {
    assert.ok(icons[name], `Unknown Lucide icon: ${name}`);
    return renderToStaticMarkup(
      React.createElement(icons[name], { size: 24, "aria-hidden": true }),
    );
  };
  for (const product of productsFixture) {
    await artPage.setContent(productArtwork(product, icon), {
      waitUntil: "load",
    });
    await artPage.evaluate(() => document.fonts.ready);
    const artwork = await artPage.screenshot({
      path: path.join(output, `product-${product.id}.png`),
    });
    const pixels = await sharp(artwork).stats();
    assert.ok(
      pixels.channels.some((channel) => channel.stdev > 15),
      "Artwork must contain visible product content",
    );
    assert.equal(
      await artPage.evaluate(() => document.documentElement.scrollHeight),
      720,
    );
    art.push(artwork);
    artworkChecks.push({
      id: product.id,
      name: product.name,
      artwork: `product-${product.id}.png`,
      width: 960,
      height: 720,
      sha256: createHash("sha256").update(artwork).digest("hex"),
    });
    console.log(
      `ARTWORK_PASS: ${product.name}; 960x720; rendered sample content`,
    );
  }
  await artContext.close();
  const products = buildProducts(api, art);
  validateProducts(products);
  const document = createDefaultStorefrontDocument("ShopOfCatt");
  const requests = [];
  fixture = createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    const url = new URL(req.url, api);
    requests.push({ method: req.method, path: url.pathname });
    if (req.method === "OPTIONS") {
      res.writeHead(204).end();
      return;
    }
    if (url.pathname.startsWith("/api/analytics/")) {
      req.resume();
      res
        .writeHead(200, { "Content-Type": "application/json" })
        .end('{"ok":true}');
      return;
    }
    if (req.method !== "GET") {
      res.writeHead(405).end();
      return;
    }
    const image = /\/api\/images\/(\d+)\.png/.exec(url.pathname);
    if (image && art[Number(image[1])]) {
      res
        .writeHead(200, { "Content-Type": "image/png" })
        .end(art[Number(image[1])]);
      return;
    }
    res.setHeader("Content-Type", "application/json");
    let data;
    if (url.pathname === "/api/products") data = products;
    else if (url.pathname.startsWith("/api/products/"))
      data = products.find(
        (product) => product.slug === url.pathname.split("/").at(-1),
      );
    else if (url.pathname === "/api/storefront")
      data = { published: true, maintenanceMode: false, document, revision: 1 };
    else if (url.pathname === "/api/rates")
      data = {
        vndPerUsdt: exchangeRate,
        cnyPerUsdt: 7.2,
        updatedAt: "2026-09-01T09:00:00Z",
      };
    else if (url.pathname === "/api/announcement")
      data = {
        active: true,
        title: "Bộ sưu tập cho công việc sáng tạo",
        body: "UI kit, template và công cụ làm việc dành cho designer, developer, freelancer. Danh mục, giá và số liệu bán hàng là dữ liệu demo.",
      };
    else if (url.pathname === "/api/payment-methods")
      data = [{ method: "BANK_TRANSFER", name: "Chuyển khoản" }];
    if (!data) {
      res.writeHead(404).end('{"message":"Demo endpoint not configured"}');
      return;
    }
    res.end(JSON.stringify(data));
  });
  await new Promise((resolve, reject) => {
    fixture.once("error", reject);
    fixture.listen(apiPort, "127.0.0.1", resolve);
  });
  child = spawn(
    process.execPath,
    [
      sourceRequire.resolve("next/dist/bin/next"),
      "dev",
      "--port",
      String(webPort),
    ],
    {
      cwd: path.join(source, "apps/web"),
      windowsHide: true,
      env: {
        ...process.env,
        API_URL: api,
        NEXT_PUBLIC_API_URL: api,
        NEXT_PUBLIC_SITE_NAME: "ShopOfCatt",
        NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${webPort}`,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (data) => {
    logs += data;
  });
  child.stderr.on("data", (data) => {
    logs += data;
  });
  for (let attempt = 0; attempt < 90; attempt++) {
    if (child.exitCode !== null) throw new Error(`Next exited: ${logs}`);
    try {
      if (
        (
          await fetch(`http://127.0.0.1:${webPort}`, {
            signal: AbortSignal.timeout(5000),
          })
        ).ok
      )
        break;
    } catch {}
    if (attempt === 89) throw new Error(`Next did not start: ${logs}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: "vi-VN",
    reducedMotion: "reduce",
  });
  await context.addCookies([
    { name: "wc_locale", value: "vi", domain: "127.0.0.1", path: "/" },
  ]);
  const page = await context.newPage();
  const errors = [];
  const blocked = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (
      ["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.protocol === "data:"
    )
      return route.continue();
    blocked.push(url.origin + url.pathname);
    return route.abort();
  });
  const screens = [];
  for (const [name, route] of [
    ["overview", "/"],
    ["detail", "/products/demo-design-kit"],
  ]) {
    const response = await page.goto(`http://127.0.0.1:${webPort}${route}`, {
      waitUntil: "networkidle",
    });
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() =>
      [...document.images].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    if (name === "detail") {
      assert.equal(await page.getByRole("radio").count(), 3);
      assert.ok((await page.locator("body").innerText()).includes("250.000"));
      assert.ok(!(await page.locator("body").innerText()).includes("250.001"));
      assert.ok((await page.locator("body").innerText()).includes("174"));
    }
    await page.addStyleTag({
      content: "nextjs-portal{display:none!important}",
    });
    await page.mouse.move(-100, -100);
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    await sharp(path.join(output, `${name}.png`))
      .webp({ quality: 92, effort: 6 })
      .toFile(path.join(output, `${name}.webp`));
    const pixels = await sharp(path.join(output, `${name}.webp`)).stats();
    assert.ok(pixels.channels.some((channel) => channel.stdev > 15));
    screens.push({
      route,
      png: `${name}.png`,
      webp: `${name}.webp`,
      width: 2880,
      height: 1800,
    });
    console.log(
      `CAPTURE ${name}: 2880x1800; real source interface; fully loaded`,
    );
  }
  assert.deepEqual(errors, []);
  const after = await sourceSnapshot();
  assert.deepEqual(
    after,
    before,
    "Source repos and file hashes must remain unchanged",
  );
  await fs.writeFile(
    path.join(output, "capture.json"),
    JSON.stringify(
      {
        repository: "https://github.com/ToolofCatt/ShopOfCatt",
        commit: before.commit,
        dirty: !!before.status,
        sourceUnchanged: true,
        sourceHashCount: Object.keys(before.hashes).length,
        fixtureRevision: 2,
        dataMode:
          "demo catalog and sales fixtures; no database/payment operations",
        fixtureSummary: {
          ...stats,
          categories: 3,
          checks: [
            "unique slugs",
            "3 variants per product",
            "stock sums",
            "sales sums",
            "VND conversions",
            "min/max prices",
            "nonblank product artwork",
          ],
        },
        products: products.map(
          ({ id, name, category, availableStock, sold, variants }) => ({
            id,
            name,
            category,
            availableStock,
            sold,
            variants,
          }),
        ),
        artworkMode:
          "Original demo-product contents rendered as HTML/CSS with Lucide icons and captured as raster PNGs; no source storefront redesign",
        artwork: artworkChecks,
        viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
        screens,
        browserErrors: errors,
        blockedRequests: blocked,
        fixtureRequests: requests,
        capturedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "SHOP_CAPTURE_PASS: two real UI screenshots; 8 content previews; 24 consistent variants; source hashes unchanged; no page errors",
  );
} finally {
  await browser.close();
  if (child && child.exitCode === null) {
    if (process.platform === "win32")
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
      });
    else child.kill();
  }
  if (fixture?.listening)
    await new Promise((resolve) => fixture.close(resolve));
  await fs.writeFile(path.join(os.tmpdir(), "myblog-shop-capture.log"), logs);
}
