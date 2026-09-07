import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const require = createRequire(path.join(workspace, "apps/web/package.json"));
const sharp = require("sharp");
const mode = process.argv[2] ?? "MODIFIED";
assert.ok(["BASELINE", "MODIFIED", "ROLLBACK"].includes(mode));
const target = path.resolve(process.argv[3] ?? workspace);
const projects = [
  "riviu-manager",
  "riviu-reports",
  "riviu-web",
  "shop-of-catt",
];
let revised = 0;
for (const project of projects) {
  const folder = path.join(target, "apps/web/public/projects", project);
  const metadata = JSON.parse(
    await readFile(path.join(folder, "capture.json"), "utf8"),
  );
  const errors = metadata.pageErrors ?? metadata.browserErrors;
  assert.deepEqual(errors, [], `${project}: browser errors`);
  if (metadata.fixtureRevision === 2) revised++;
  if (mode === "MODIFIED") {
    assert.equal(metadata.fixtureRevision, 2, `${project}: demo revision`);
    assert.ok(
      metadata.fixtureSummary &&
        Object.keys(metadata.fixtureSummary).length > 0,
    );
  }
  for (const name of ["overview", "detail"]) {
    for (const extension of ["png", "webp"]) {
      const image = sharp(path.join(folder, `${name}.${extension}`));
      const info = await image.metadata();
      const width =
        extension === "webp" &&
        ["riviu-manager", "riviu-reports"].includes(project)
          ? 1920
          : 2880;
      assert.equal(info.width, width);
      assert.equal(info.height, (width * 5) / 8);
      const stats = await image.stats();
      assert.ok(
        stats.channels.some((channel) => channel.stdev > 15),
        `${project}/${name}: blank image`,
      );
    }
  }
}
console.log(
  `${mode}_CAPTURES_PASS: 4 projects; 8 screenshots; 16 images decoded and nonblank; revised fixtures=${revised}/4; browser errors=0.`,
);
