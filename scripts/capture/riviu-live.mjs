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
const output = path.join(root, "apps/web/public/projects/riviu-web");
const origin = "https://taskscatt.click";
const viewport = { width: 1440, height: 900 };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
try {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    locale: "vi-VN",
  });
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  const screenshots = [];
  for (const shot of [
    {
      id: "live-overview",
      route: "/",
      selector: null,
      caption: "Trang chủ Riviu đang hoạt động",
    },
    {
      id: "live-detail",
      route: "/bang-gia",
      selector: "#combo",
      caption: "Bảng giá dịch vụ trên website",
    },
  ]) {
    const response = await page.goto(origin + shot.route, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    if (shot.selector) {
      await page.locator(shot.selector).scrollIntoViewIfNeeded();
      await page.evaluate((selector) => {
        const section = document.querySelector(selector);
        window.scrollTo({
          top: scrollY + section.getBoundingClientRect().top - 48,
          behavior: "instant",
        });
      }, shot.selector);
      await page.waitForTimeout(1600);
    }
    await page.mouse.move(-100, -100);
    await page.waitForTimeout(500);
    const visibleImages = await page.locator("img").evaluateAll((images) =>
      images
        .filter((image) => {
          const box = image.getBoundingClientRect();
          return (
            box.width > 0 &&
            box.height > 0 &&
            box.top < innerHeight &&
            box.bottom > 0
          );
        })
        .map((image) => ({
          src: image.currentSrc,
          loaded: image.complete && image.naturalWidth > 0,
        })),
    );
    assert.ok(visibleImages.length > 0);
    assert.ok(
      visibleImages.every((image) => image.loaded),
      "Visible live images must load",
    );
    const png = path.join(output, `${shot.id}.png`);
    const webp = path.join(output, `${shot.id}.webp`);
    await page.screenshot({ path: png });
    await sharp(png).webp({ quality: 92, effort: 6 }).toFile(webp);
    const info = await sharp(webp).metadata();
    const pixels = await sharp(webp).stats();
    assert.equal(info.width, 2880);
    assert.equal(info.height, 1800);
    assert.ok(pixels.channels.some((channel) => channel.stdev > 15));
    screenshots.push({
      ...shot,
      url: page.url(),
      status: response.status(),
      title: await page.title(),
      png: `${shot.id}.png`,
      webp: `${shot.id}.webp`,
      width: info.width,
      height: info.height,
      sha256: createHash("sha256")
        .update(await readFile(webp))
        .digest("hex"),
      visibleImages,
    });
    console.log(
      `LIVE_CAPTURE ${shot.id}: HTTP 200; 2880x1800; visible images loaded.`,
    );
  }
  assert.deepEqual(browserErrors, []);
  await writeFile(
    path.join(output, "live-capture.json"),
    JSON.stringify(
      {
        project: "Riviu Web",
        websiteUrl: `${origin}/`,
        dataMode: "live",
        capturedAt: new Date().toISOString(),
        viewport,
        deviceScaleFactor: 2,
        method:
          "Public website opened in a fresh browser context; no account, form submission, fixture responses or application DOM changes.",
        screenshots,
        browserErrors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "RIVIU_LIVE_PASS: 2 public website screenshots; HTTP 200; no browser errors.",
  );
} finally {
  await browser.close();
}
