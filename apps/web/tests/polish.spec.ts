import { expect, test } from "@playwright/test";

test("initial visit uses Vietnamese web fonts and only the overview map", async ({
  page,
}) => {
  const maps: string[] = [];
  page.on("request", (r) => {
    if (/\/map-.*\.webp/.test(r.url())) maps.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator('[data-layer="vietnam"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
  expect(maps).toHaveLength(1);
  expect(maps[0]).toContain("map-vietnam");
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((r) => /\.(woff2?|ttf)/.test(r.name))
      .map((r) => r.name),
  );
  expect(fonts.every((src) => src.includes(".woff2"))).toBe(true);
  expect(fonts.some((src) => src.includes("Mono"))).toBe(false);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument");
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: "#gioi-thieu p",
  });
  const used = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  expect(
    used.fonts.every(
      (font) => font.isCustomFont && font.familyName === "Geist",
    ),
  ).toBe(true);
});

test("a slow detail image keeps the overview visible until decoding finishes", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/portfolio/map-*.webp*", async (route) => {
    if (!route.request().url().includes("map-vietnam")) await gate;
    await route.continue();
  });
  await page.goto("/");
  await expect(page.locator('[data-layer="vietnam"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(() => {
    const s = document.querySelector("section[data-chapter]") as HTMLElement;
    scrollTo({
      top: (s.offsetHeight - innerHeight) * 0.97,
      behavior: "instant",
    });
  });
  await expect(page.locator('[data-layer="dalat"] img')).toBeAttached();
  await expect(page.locator('[data-layer="vietnam"]')).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator('[data-layer="dalat"]')).toHaveCSS("opacity", "0");
  release();
  await expect(page.locator('[data-layer="dalat"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect
    .poll(() =>
      page
        .locator('[data-layer="dalat"]')
        .evaluate((e) => Number(getComputedStyle(e).opacity)),
    )
    .toBeGreaterThan(0.99);
});

for (const language of ["vi", "en"]) {
  test(`header stays on one line per label at 640px and CV downloads in ${language}`, async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.addInitScript(
      (language) => localStorage.setItem("portfolio-language", language),
      language,
    );
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    const sizes = await page.locator("header nav a").evaluateAll((nodes) =>
      nodes.map((el) => ({
        height: el.getBoundingClientRect().height,
        whitespace: getComputedStyle(el).whiteSpace,
        right: el.getBoundingClientRect().right,
      })),
    );
    expect(
      sizes.every(
        (v) => v.height <= 36 && v.whitespace === "nowrap" && v.right <= 640,
      ),
    ).toBe(true);
    const link = page.locator("#lien-he a[download]");
    await expect(link).toHaveAttribute(
      "href",
      `/cv/do-hien-dinh-${language}.pdf`,
    );
    const downloadPromise = page.waitForEvent("download");
    await link.click();
    expect((await downloadPromise).suggestedFilename()).toBe(
      `do-hien-dinh-${language}.pdf`,
    );
    const pdf = await request.get(`/cv/do-hien-dinh-${language}.pdf`);
    expect(pdf.status()).toBe(200);
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
    await expect(
      page.locator('#lien-he a[href="https://github.com/cattfan"]'),
    ).toBeVisible();
  });
}

for (const [width, progress] of [
  [1440, 0.18],
  [390, 0.43],
] as const) {
  test(`map labels avoid compass and destination at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate((p) => {
      const s = document.querySelector("section[data-chapter]") as HTMLElement;
      scrollTo({
        top: p * (s.offsetHeight - innerHeight),
        behavior: "instant",
      });
    }, progress);
    await page.waitForTimeout(350);
    const result = await page.evaluate(() => {
      const c = document.querySelector("[data-map-linework]") as HTMLElement;
      const b = document.querySelector("[data-book-frame]") as HTMLElement;
      const old = b.style.transform;
      b.style.transform = "none";
      const r = c.getBoundingClientRect();
      const targets = [
        ...document.querySelectorAll(
          "[data-compass],[data-map-label],[data-geographic-pin]",
        ),
      ].map((el) => {
        const t = el.getBoundingClientRect();
        return {
          x: t.x - r.x - 3,
          y: t.y - r.y - 3,
          width: t.width + 6,
          height: t.height + 6,
        };
      });
      b.style.transform = old;
      const boxes = JSON.parse(c.dataset.labelBoxes || "[]") as {
        x: number;
        y: number;
        width: number;
        height: number;
        name: string;
      }[];
      return {
        count: boxes.length,
        collisions: boxes
          .filter((a) =>
            targets.some(
              (t) =>
                a.x < t.x + t.width &&
                a.x + a.width > t.x &&
                a.y < t.y + t.height &&
                a.y + a.height > t.y,
            ),
          )
          .map((b) => b.name),
      };
    });
    expect(result.count).toBeGreaterThan(0);
    expect(result.collisions).toEqual([]);
  });
}
