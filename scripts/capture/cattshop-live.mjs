import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const require = createRequire(path.join(root, "apps/web/package.json"));
const { chromium } = require("@playwright/test");
const sharp = require("sharp");
const output = path.join(root, "apps/web/public/projects/shop-of-catt");
const origin = "https://cattshop.site";
const viewport = { width: 1440, height: 900, deviceScaleFactor: 2 };
const screens = [
  {
    name: "live-overview",
    url: `${origin}/`,
    caption: "Danh mục sản phẩm trên Catt Store",
  },
  {
    name: "live-detail",
    url: `${origin}/products/chatgpt-plus-account-30d-warranty-12h`,
    caption: "Trang sản phẩm và các lựa chọn trên Catt Store",
  },
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    "C:/Users/cattfan/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe",
});
const errors = [];
const consoleErrors = [];
const requests = [];
const captured = [];
try {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    locale: "vi-VN",
    reducedMotion: "reduce",
  });
  await context.addCookies([
    { name: "wc_locale", value: "vi", domain: "cattshop.site", path: "/" },
  ]);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method()))
      requests.push({ method: request.method(), url: request.url() });
  });
  for (const screen of screens) {
    const response = await page.goto(screen.url, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    assert.equal(
      response.status(),
      200,
      `Live request must succeed: ${screen.url}`,
    );
    assert.equal(new URL(page.url()).origin, origin);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() =>
      [...document.images].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    await page.mouse.move(-100, -100);
    await page.waitForTimeout(600);
    const png = `${screen.name}.png`;
    const webp = `${screen.name}.webp`;
    await page.screenshot({
      path: path.join(output, png),
      animations: "disabled",
    });
    await sharp(path.join(output, png))
      .webp({ quality: 92, effort: 6 })
      .toFile(path.join(output, webp));
    const metadata = await sharp(path.join(output, webp)).metadata();
    const pixels = await sharp(path.join(output, webp)).stats();
    assert.equal(metadata.width, 2880);
    assert.equal(metadata.height, 1800);
    assert.ok(
      pixels.channels.some((channel) => channel.stdev > 15),
      "Live capture must be nonblank",
    );
    captured.push({
      ...screen,
      finalUrl: page.url(),
      status: response.status(),
      title: await page.title(),
      png,
      webp,
      width: metadata.width,
      height: metadata.height,
      sha256: createHash("sha256")
        .update(await readFile(path.join(output, webp)))
        .digest("hex"),
      capturedAt: new Date().toISOString(),
      productLinks: await page
        .locator('a[href^="/products/"]')
        .evaluateAll((links) =>
          links.map((link) => ({
            url: link.href,
            title:
              link.querySelector("h3")?.textContent ?? link.textContent.trim(),
          })),
        ),
      images: await page.locator("img").evaluateAll((images) =>
        images.map((image) => ({
          src: image.currentSrc,
          loaded: image.complete && image.naturalWidth > 0,
        })),
      ),
    });
    console.log(
      `LIVE_CAPTURE ${screen.name}: HTTP ${response.status()}; 2880x1800; loaded images; ${page.url()}`,
    );
  }
  assert.deepEqual(
    errors,
    [],
    "Live pages must render without uncaught errors",
  );
  await writeFile(
    path.join(output, "live-capture.json"),
    JSON.stringify(
      {
        project: "ShopOfCatt",
        liveBrand: "Catt Store",
        type: "live",
        website: origin,
        repository: "https://github.com/ToolofCatt/ShopOfCatt",
        dataMode:
          "Public production pages; original products, artwork, prices and stock statuses; no fixture responses or application UI changes",
        locale: "vi-VN",
        viewport,
        browserErrors: errors,
        consoleErrors,
        automaticNonGetRequests: requests,
        accountActions: [],
        sourceChanges: [],
        screenshots: captured,
        capturedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "CATTSHOP_LIVE_PASS: two public production screenshots; no account or order actions; no page errors",
  );
} finally {
  await browser.close();
}
