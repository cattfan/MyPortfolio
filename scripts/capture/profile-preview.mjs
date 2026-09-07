import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const require = createRequire(path.join(root, "apps/web/package.json"));
const { chromium } = require("@playwright/test");
const sharp = require("sharp");
const output = path.join(root, "output/profile-preview");
const assets = path.join(root, "docs/github-profile/assets");
await mkdir(output, { recursive: true });
await mkdir(assets, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  await page.goto(process.env.PORTFOLIO_URL || "http://113.161.254.76:18088/", {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    document.querySelector('section[data-enhanced="true"]'),
  );
  await page.waitForTimeout(800);
  const frames = [
    0,
    ...Array.from({ length: 36 }, (_, i) => ((i + 1) * 0.97) / 36),
  ];
  for (const [i, p] of frames.entries()) {
    await page.evaluate((progress) => {
      const el = document.querySelector("section[data-chapter]");
      window.scrollTo({
        top: progress * (el.offsetHeight - innerHeight),
        behavior: "instant",
      });
    }, p);
    await page.waitForTimeout(i === 0 ? 500 : 300);
    const book = await page.locator("[data-book-frame]").screenshot();
    await sharp(book)
      .resize(880)
      .png()
      .toFile(path.join(output, `${String(i).padStart(3, "0")}.png`));
    if (i === 0)
      await sharp(book)
        .resize(1100)
        .png()
        .toFile(path.join(assets, "portfolio.png"));
  }
  console.log(
    `PREVIEW_CAPTURE_PASS: ${frames.length} actual portfolio frames; image assets ready.`,
  );
} finally {
  await browser.close();
}
