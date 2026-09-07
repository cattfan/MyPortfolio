import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const require = createRequire(path.join(root, "apps/web/package.json"));
const sharp = require("sharp");
const mode = process.argv[2] ?? "MODIFIED";
assert.ok(["BASELINE", "MODIFIED", "ROLLBACK"].includes(mode));
const target = path.resolve(process.argv[3] ?? root);
const assetRoot = path.resolve(process.argv[4] ?? target);
const { projects } = await import(
  pathToFileURL(path.join(target, "apps/web/content/portfolio.ts"))
);
const previousLiveUrls = {
  "riviu-web": "https://taskscatt.click/",
};
const expected =
  mode === "MODIFIED"
    ? { "riviu-web": previousLiveUrls["riviu-web"] }
    : previousLiveUrls;
const expectedProjectIds =
  mode === "MODIFIED"
    ? ["riviu-manager", "riviu-web"]
    : ["riviu-manager", "riviu-reports", "riviu-web"];
assert.deepEqual(
  projects.map((project) => project.id),
  expectedProjectIds,
);
const live = projects.filter((project) => project.liveUrl);
assert.equal(live.length, Object.keys(expected).length);
if (mode === "MODIFIED") {
  assert.ok(
    projects.every((project) => !project.repositoryUrl),
    "Public project data must omit source-code links",
  );
}
for (const project of live) {
  assert.equal(project.liveUrl, expected[project.id]);
  assert.equal(project.screenshotSource, "live");
  assert.equal(project.screenshots.length, 2);
  const directory = path.join(
    assetRoot,
    "apps/web/public/projects",
    project.id,
  );
  const metadata = JSON.parse(
    await readFile(path.join(directory, "live-capture.json"), "utf8"),
  );
  assert.ok(metadata.dataMode === "live" || metadata.type === "live");
  assert.deepEqual(metadata.browserErrors, []);
  assert.equal(metadata.screenshots.length, 2);
  for (const [index, image] of project.screenshots.entries()) {
    const record = metadata.screenshots[index];
    assert.equal(record.status, 200);
    assert.equal(new URL(record.url).origin, new URL(project.liveUrl).origin);
    assert.equal(
      path.basename(new URL(image.src, "http://localhost").pathname),
      record.webp,
    );
    const buffer = await readFile(path.join(directory, record.webp));
    assert.equal(
      createHash("sha256").update(buffer).digest("hex"),
      record.sha256,
    );
    for (const file of [record.webp, record.png]) {
      const bitmap = sharp(path.join(directory, file));
      const info = await bitmap.metadata();
      assert.equal(info.width, image.width);
      assert.equal(info.height, image.height);
      const stats = await bitmap.stats();
      assert.ok(stats.channels.some((channel) => channel.stdev > 15));
    }
  }
}
assert.ok(
  projects
    .filter((project) => !project.liveUrl)
    .every((project) => project.screenshotSource === "demo"),
);
console.log(
  `${mode}_LIVE_PASS: ${projects.length} projects; live links=${live.length}; live screenshots=${live.length * 2}; ${live.length * 4} images decoded; HTTP 200; browser errors=0; capture provenance retained.`,
);
