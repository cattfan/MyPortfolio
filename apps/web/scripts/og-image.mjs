import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";

// Social preview (Open Graph) image: the live book at its first chapter, framed
// with the name and role. Needs the site running locally:
//   pnpm --filter web dev   then   pnpm --filter web assets:og [url]
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = process.argv[2] ?? "http://127.0.0.1:3000/";
const base64 = async (file) => (await readFile(path.join(app, file))).toString("base64");

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
try {
  const capture = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  await capture.addInitScript(() => localStorage.setItem("portfolio-language", "vi"));
  await capture.goto(url, { waitUntil: "load" });
  await capture.evaluate(() => document.fonts.ready);
  await capture.waitForSelector('section[data-enhanced="true"]');
  // Let the route intro finish drawing before the capture.
  await capture.waitForTimeout(4000);
  const book = await capture.locator("[data-book-frame]").screenshot({ omitBackground: true });

  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(`<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><style>
@font-face { font-family: Geist; src: url(data:font/woff2;base64,${await base64("app/fonts/Geist-Regular.woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Book; src: url(data:font/woff2;base64,${await base64("app/fonts/SourceSerif4-Regular.woff2")}) format("woff2"); }
@font-face { font-family: Book; font-style: italic; src: url(data:font/woff2;base64,${await base64("app/fonts/SourceSerif4-Italic.woff2")}) format("woff2"); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: #ece7dc; color: #2b2721; font-family: Geist, sans-serif; }
.wash { position: absolute; inset: 0; opacity: .8; background: linear-gradient(90deg, #ece7dcf2 0%, #ece7dcb0 42%, #ece7dc30 100%), url(data:image/webp;base64,${await base64("public/portfolio/reference-wash.webp")}) center / cover; }
.text { position: absolute; left: 76px; top: 0; bottom: 0; width: 470px; display: flex; flex-direction: column; justify-content: center; }
.eyebrow { font-size: 21px; letter-spacing: .02em; color: #62594e; }
h1 { font-family: Book, serif; font-weight: 400; font-size: 86px; line-height: 1.05; margin: 18px 0 22px; }
.role { font-family: Book, serif; font-style: italic; font-size: 34px; color: #80542f; }
.line { margin-top: 18px; font-size: 22px; line-height: 1.45; color: #4e463c; }
.site { margin-top: 44px; display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 500; }
.site i { width: 14px; height: 14px; border-radius: 50%; background: #ac4037; box-shadow: 0 0 0 3px #fffae9, 0 0 0 5px #ac403759; }
.book { position: absolute; right: -86px; top: 50%; width: 760px; transform: translateY(-50%) rotate(-2.5deg); filter: drop-shadow(0 26px 30px #3a2c1a40); }
</style></head><body>
<div class="wash"></div>
<div class="text">
  <div class="eyebrow">Đà Lạt, Việt Nam</div>
  <h1>Đỗ Hiền Dinh</h1>
  <div class="role">Software Engineer</div>
  <p class="line">Web &amp; ứng dụng desktop,<br>từ giao diện đến server.</p>
  <div class="site"><i></i>cattfan.site</div>
</div>
<img class="book" src="data:image/png;base64,${book.toString("base64")}" alt="">
</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: "png" });
  const target = path.join(app, "app/opengraph-image.jpg");
  const { size } = await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(target);
  await writeFile(
    path.join(app, "app/opengraph-image.alt.txt"),
    "Đỗ Hiền Dinh, Software Engineer ở Đà Lạt, bên cạnh cuốn sổ mở với bản đồ Việt Nam và hành trình tới Đà Lạt.\n",
  );
  console.log(`OG_PASS: app/opengraph-image.jpg 1200x630 ${Math.round(size / 1024)} KB`);
} finally {
  await browser.close();
}
