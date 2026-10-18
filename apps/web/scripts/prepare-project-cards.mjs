import { access, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Card thumbnails for the project carousels. The gallery keeps the full-size
// screenshots; cards only need enough pixels for a ~560px slot at 2x density.
const CARD_WIDTH = 1100;
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { projects } = await import("../content/portfolio.ts");

const local = (url) =>
  path.join(app, "public", new URL(url, "http://local").pathname.slice(1));

for (const project of projects) {
  for (const image of project.screenshots) {
    const original = local(image.src);
    // Prefer the lossless PNG capture when it is checked in beside the WebP copy.
    const png = original.replace(/\.webp$/, ".png");
    const source = await access(png).then(
      () => png,
      () => original,
    );
    const target = local(image.card);
    const { width, height } = await sharp(source)
      .resize({ width: CARD_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(target);
    const { size } = await stat(target);
    console.log(
      `CARD ${path.relative(app, target)} ${width}x${height} ${Math.round(size / 1024)} KB from ${path.basename(source)}`,
    );
  }
}
