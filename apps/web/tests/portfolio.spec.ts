import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { geoContains, geoMercator, type GeoPermissibleObjects } from "d3-geo";
import mapAssets from "../public/portfolio/assets.json" with { type: "json" };
import { getCameraPose, getPlateTransform } from "../lib/book-camera";
import { journeyChapters, portfolio, projects } from "../content/portfolio";

test.beforeEach(async ({ page }, testInfo) => {
  if (!testInfo.title.startsWith("language:")) {
    await page.addInitScript(() =>
      localStorage.setItem("portfolio-language", "vi"),
    );
  }
});

test("footer thanks the visitor in both languages and the entrance runs once", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.locator("footer");
  const beforeHeight = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toHaveAttribute("data-reveal", "seen");
  await expect(footer).toContainText(
    "Cảm ơn bạn đã dành thời gian tìm hiểu về mình.",
  );
  await expect
    .poll(() => footer.evaluate((e) => e.getAnimations().length))
    .toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(
    beforeHeight,
  );
  await page.locator("[data-language-toggle]").click();
  await expect(footer).toContainText(
    "Thanks for taking the time to get to know me.",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-language-transition",
    "idle",
  );
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await footer.scrollIntoViewIfNeeded();
  expect(await footer.evaluate((e) => e.getAnimations().length)).toBe(0);
});

test("section entrances respect reduced motion and content remains visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const footer = page.locator("footer");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toHaveAttribute("data-reveal", "seen");
  await expect(footer).toHaveCSS("opacity", "1");
  expect(await footer.evaluate((e) => e.getAnimations().length)).toBe(0);
  await expect(
    footer.getByRole("link", { name: "Về đầu trang" }),
  ).toBeVisible();
});

test("language: Vietnamese is default and the toggle translates content and persists", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lập trình từ sự tò mò." }),
  ).toBeVisible();
  await expect(page.locator("#kinh-nghiem")).toContainText(
    "Không chỉ viết cho chạy",
  );
  await expect(page.locator("#du-an article")).toHaveCount(2);
  await expect(page.locator("#du-an")).not.toContainText("Riviu Reports");
  await page.locator("[data-language-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "It starts with curiosity." }),
  ).toBeVisible();
  await expect(page.locator("#kinh-nghiem")).toContainText(
    "More than getting it to run",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.locator("[data-language-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await page.locator("[data-language-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page
    .getByRole("button", { name: "Explore project Riviu Manager", exact: true })
    .click();
  const modal = page.getByRole("dialog", {
    name: "Project details Riviu Manager",
  });
  await expect(modal).toContainText("My contribution");
  await expect(modal).toContainText("Full product development");
  await modal.getByRole("button", { name: "Close details" }).click();
  await expect(modal).not.toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("language: switching fades text, keeps the book state and handles rapid toggles", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Nội dung cuốn sổ" })
    .selectOption("1");
  await expect(page.locator("section[data-chapter]")).toHaveAttribute(
    "data-chapter",
    "1",
  );
  await page.waitForTimeout(700);
  const y = await page.evaluate(() => scrollY);
  await page.locator("[data-language-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-language-transition",
    /exit|enter/,
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute(
    "data-language-transition",
    "idle",
  );
  await expect(page.locator("section[data-chapter]")).toHaveAttribute(
    "data-chapter",
    "1",
  );
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(y, 0);
  await page.locator("[data-language-toggle]").click();
  await page.locator("[data-language-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute(
    "data-language-transition",
    "idle",
  );
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    ),
  ).toBe(0);
});

test("language: reduced motion switches immediately and missing storage still works", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("storage blocked");
    };
    Storage.prototype.getItem = () => {
      throw new Error("storage blocked");
    };
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await page.locator("[data-language-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute(
    "data-language-transition",
    "idle",
  );
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

for (const width of [1440, 390, 320]) {
  test(`fixed header remains visible and copies both contacts at ${width}px`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("section[data-enhanced='true']")).toBeAttached();
    const header = page.getByRole("banner");
    const initial = await header.boundingBox();
    for (const selector of ["#du-an", "#kinh-nghiem", "#lien-he"]) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const box = await header.boundingBox();
      expect(box!.y).toBe(0);
      expect(box!.height).toBe(initial!.height);
      await expect(
        header.locator('[data-header-copy="email"]'),
      ).toBeInViewport();
      await expect(header.locator("[data-language-toggle]")).toBeInViewport();
    }
    await header.locator('[data-header-copy="email"]').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      portfolio.email,
    );
    await expect(header.getByRole("status")).toContainText(portfolio.email);
    await header.locator('[data-header-copy="phone"]').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      portfolio.phone,
    );
    await expect(header.getByRole("status")).toContainText(portfolio.phone);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `test-results/fixed-header-${width}.png` });
  });
}

test("header copy failure leaves a readable contact value", async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.execCommand = () => false;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      configurable: true,
    });
  });
  await page.goto("/");
  await page.locator('[data-header-copy="phone"]').click();
  await expect(page.getByRole("banner").getByRole("status")).toHaveText(
    portfolio.phone,
  );
});

for (const language of ["en", "vi"] as const) {
  for (const width of [1440, 390, 320]) {
    test(`language: ${language} fits ${width}px with a clear compass and Phu Quoc label`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript(
        (lang) => localStorage.setItem("portfolio-language", lang),
        language,
      );
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      const label = language === "en" ? "Phu Quoc" : "Phú Quốc";
      await expect
        .poll(async () =>
          JSON.parse(
            (await page
              .locator("[data-map-linework]")
              .getAttribute("data-labels")) ?? "[]",
          ),
        )
        .toContain(label);
      await expect(page.locator("[data-compass]")).toContainText(
        language === "en" ? "N" : "B",
      );
      await expect(page.locator("[data-compass] svg")).toHaveCount(0);
      const compass = page.locator("[data-compass]");
      const expectedDirections =
        language === "vi"
          ? { north: "B", east: "Đ", south: "N", west: "T" }
          : { north: "N", east: "E", south: "S", west: "W" };
      for (const [direction, text] of Object.entries(expectedDirections))
        await expect(
          compass.locator(`[data-direction="${direction}"]`),
        ).toHaveText(text);
      const positions = await compass.evaluate((element) =>
        Object.fromEntries(
          [...element.querySelectorAll<HTMLElement>("[data-direction]")].map(
            (label) => {
              const r = label.getBoundingClientRect();
              return [
                label.dataset.direction,
                { x: r.x + r.width / 2, y: r.y + r.height / 2 },
              ];
            },
          ),
        ),
      );
      expect(positions.north!.y).toBeLessThan(positions.south!.y);
      expect(positions.west!.x).toBeLessThan(positions.east!.x);
      for (const chapter of [0, 1, 2, 3]) {
        await page
          .getByRole("combobox", {
            name: language === "en" ? "Book chapters" : "Nội dung cuốn sổ",
          })
          .selectOption(String(chapter));
        await expect(page.locator("section[data-chapter]")).toHaveAttribute(
          "data-chapter",
          String(chapter),
        );
        await page.waitForTimeout(450);
        const fits = await page
          .locator('[data-current="true"]')
          .evaluate(
            (el) =>
              el.querySelector("p")!.getBoundingClientRect().bottom <=
              el.getBoundingClientRect().bottom,
          );
        if (width > 640) expect(fits).toBe(true);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/language-${language}-${width}.png`,
      });
    });
  }
}

test("atlas uses sourced elevation plates and keeps the physical map geometry", async ({
  request,
}) => {
  expect(mapAssets.terrain.tiles).toBeGreaterThan(0);
  expect(mapAssets.terrain.plates).toHaveLength(6);
  expect(mapAssets.terrain.encoding).toContain("Terrarium");
  for (const plate of mapAssets.terrain.plates) {
    expect(plate.landPixels).toBeGreaterThan(0);
    expect(plate.elevationRangeMeters[1]).toBeGreaterThan(
      plate.elevationRangeMeters[0]!,
    );
    expect(plate.tileCount).toBeGreaterThan(0);
  }
  const source =
    process.env.PORTFOLIO_STATIC === "1"
      ? JSON.parse(
          await readFile(
            new URL(
              "../public/portfolio/terrain-sources.json",
              import.meta.url,
            ),
            "utf8",
          ),
        )
      : await (await request.get(mapAssets.terrain.manifest)).json();
  expect(source.tiles).toHaveLength(mapAssets.terrain.tiles);
  expect(source.tiles[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  for (const plate of [...mapAssets.maps, ...mapAssets.detailMaps]) {
    expect(plate.src).toContain("v=atlas-20260907");
    expect(plate.overscan).toBe(2);
  }
});

for (const width of [1440, 390]) {
  test(`atlas scale is accurate and changes with zoom at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto("/");
    const linework = page.locator("[data-map-linework]");
    const distances: number[] = [];
    for (const chapter of [0, 1, 2, 3]) {
      await page
        .getByRole("combobox", { name: "Nội dung cuốn sổ" })
        .selectOption(String(chapter));
      await expect(page.locator("section[data-chapter]")).toHaveAttribute(
        "data-chapter",
        String(chapter),
      );
      await page.waitForTimeout(700);
      await expect(linework).toHaveAttribute("data-atlas", "true");
      const ruler = await linework.evaluate((canvas) => ({
        meters: Number((canvas as HTMLElement).dataset.scaleMeters),
        pixels: Number((canvas as HTMLElement).dataset.scalePixels),
        metersPerPixel: Number((canvas as HTMLElement).dataset.metersPerPixel),
        width: canvas.clientWidth,
      }));
      expect(ruler.meters).toBeGreaterThan(0);
      expect(ruler.pixels * ruler.metersPerPixel).toBeCloseTo(ruler.meters, 5);
      expect(ruler.pixels).toBeLessThan(ruler.width * 0.3);
      distances.push(ruler.meters);
      await page.screenshot({
        path: `test-results/atlas-${width}-${chapter}.png`,
      });
    }
    expect(distances[3]).toBeLessThan(distances[0]! / 100);
    expect(
      requests.some((url) =>
        /elevation-tiles|terrain-sources|s3\.amazonaws/.test(url),
      ),
    ).toBe(false);
  });
}

test("two projects show clear descriptions without source-code links or removed copy", async ({
  page,
  request,
}) => {
  await page.goto("/#du-an");
  await expect(page.locator("#du-an article")).toHaveCount(2);
  await expect(page.locator("[data-project-details-trigger]")).toHaveCount(2);
  await expect(page.locator("[data-carousel-controls]")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Riviu Reports");
  await expect(page.locator("body")).not.toContainText("Ba dự án:");
  await expect(page.locator("#kinh-nghiem")).not.toContainText("Năm 01");
  await expect(page.locator("#kinh-nghiem")).not.toContainText("Năm 02");
  await expect(page).toHaveTitle("Đỗ Hiền Dinh | Software Engineer");
  for (const chapter of journeyChapters) {
    expect(chapter.description).not.toMatch(/Riviu|Mình xây giao diện/);
  }
  await expect(page.locator("body")).not.toContainText("02 ảnh");
  await expect(page.locator("[data-journey-frame]")).not.toContainText(
    "Web & App Developer",
  );
  await expect(page.getByRole("link", { name: /OpenStreetMap/ })).toHaveCount(
    0,
  );
  await expect(page.locator('a[href*="github.com"]')).toHaveCount(0);
  await expect(page.locator('[data-project-id="shop-of-catt"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("ShopOfCatt");
  await expect(page.locator("body")).not.toContainText("Portfolio cá nhân");
  await expect(page.locator("body")).not.toContainText("Việt Nam · 2026");
  await expect(page.locator("body")).not.toContainText(
    "Ảnh chụp với dữ liệu demo",
  );
  await expect(page.locator('[data-project-id="riviu-manager"]')).toContainText(
    "Phần mềm quản lý đa thiết bị di động",
  );
  await expect(
    page.getByRole("link", { name: portfolio.email, exact: true }),
  ).toHaveAttribute("href", "mailto:dohiendinh.work@gmail.com");
  await expect(
    page.getByRole("link", { name: "+84 964 173 913", exact: true }),
  ).toHaveAttribute("href", "tel:+84964173913");
  for (const project of projects) {
    const article = page.locator(`[data-project-id="${project.id}"]`);
    await expect(
      article.getByRole("heading", { name: project.name, exact: true }),
    ).toBeVisible();
    await article.locator("[data-project-details-trigger]").click();
    const details = page.getByRole("dialog", {
      name: `Chi tiết dự án ${project.name}`,
    });
    await expect(details).toHaveAttribute("data-phase", "open");
    await expect(details).toContainText("Phát triển toàn bộ sản phẩm");
    const website = article.getByRole("link", {
      name: `Xem website ${project.name}`,
      exact: true,
    });
    if (project.liveUrl) {
      await expect(website).toHaveAttribute("href", project.liveUrl);
      await expect(website).toHaveAttribute("target", "_blank");
      await expect(website).toHaveAttribute("rel", "noopener noreferrer");
    } else {
      await expect(website).toHaveCount(0);
    }
    const detailImage = details.getByRole("img");
    await detailImage.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        detailImage.evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    for (const image of project.screenshots) {
      const response = await request.get(image.src);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toContain("image/webp");
    }
    await details
      .getByRole("button", { name: "Đóng chi tiết", exact: true })
      .click();
    await expect(details).not.toBeVisible();
  }
});

for (const width of [1440, 390, 320]) {
  test(`project galleries load both photos and restore focus at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#du-an");
    await page.evaluate(() => {
      document.body.style.overflow = "auto";
    });
    for (const project of projects) {
      const carousel = page.locator(`[data-carousel="${project.id}"]`);
      await carousel.scrollIntoViewIfNeeded();
      await carousel.hover();
      const startIndex = Number(
        await carousel.getAttribute("data-slide-index"),
      );
      const opener = page.getByRole("button", {
        name: `Xem ảnh ${project.name}`,
        exact: true,
      });
      await opener.click();
      const dialog = page.getByRole("dialog", {
        name: `Ảnh dự án ${project.name}`,
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("data-phase", "open");
      await expect(dialog).toHaveCSS("opacity", "1");
      await expect(dialog).not.toContainText("Ảnh chụp với dữ liệu demo");
      await expect(
        dialog.getByRole("button", { name: "Đóng ảnh", exact: true }),
      ).toBeFocused();
      expect(await page.evaluate(() => document.body.style.overflow)).toBe(
        "hidden",
      );
      for (let index = 0; index < 2; index++) {
        const image = project.screenshots[(startIndex + index) % 2]!;
        const rendered = dialog.getByRole("img", {
          name: image.alt,
          exact: true,
        });
        await expect(rendered).toBeVisible();
        await expect
          .poll(() =>
            rendered.evaluate((img) => (img as HTMLImageElement).naturalWidth),
          )
          .toBe(image.width);
        const bounds = await dialog.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        expect(bounds!.y).toBeGreaterThanOrEqual(0);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(901);
        await page.screenshot({
          path: `test-results/project-${project.id}-${index}-${width}.png`,
        });
        if (index === 0)
          await dialog
            .getByRole("button", { name: "Ảnh tiếp theo", exact: true })
            .click();
      }
      await page.keyboard.press("ArrowRight");
      await expect(dialog.getByRole("img")).toHaveAttribute(
        "src",
        project.screenshots[startIndex]!.src,
      );
      await page.keyboard.press("ArrowLeft");
      await expect(dialog.getByRole("img")).toHaveAttribute(
        "src",
        project.screenshots[(startIndex + 1) % 2]!.src,
      );
      await dialog
        .getByRole("button", { name: "Ảnh trước", exact: true })
        .click();
      await expect(dialog.getByRole("img")).toHaveAttribute(
        "src",
        project.screenshots[startIndex]!.src,
      );
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(opener).toBeFocused();
      expect(await page.evaluate(() => document.body.style.overflow)).toBe(
        "auto",
      );
      await opener.click();
      await dialog
        .getByRole("button", { name: "Đóng ảnh", exact: true })
        .click();
      await expect(opener).toBeFocused();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    await page
      .locator("#du-an")
      .screenshot({ path: `test-results/projects-${width}.png` });
  });
}

test("carousel slides after five seconds and pauses during interaction and offscreen", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#du-an");
  const carousel = page.locator('[data-carousel="riviu-manager"]');
  await carousel.scrollIntoViewIfNeeded();
  await carousel.hover();
  await expect(carousel).toHaveAttribute("data-autoplay", "paused");
  await page.clock.pauseAt(new Date());
  const initial = Number(await carousel.getAttribute("data-slide-index"));
  await page.mouse.move(0, 0);
  await expect(carousel).toHaveAttribute("data-autoplay", "running");
  await page.clock.runFor(4999);
  await expect(carousel).toHaveAttribute("data-slide-index", String(initial));
  await page.clock.runFor(1);
  await expect(carousel).toHaveAttribute(
    "data-slide-index",
    String((initial + 1) % 2),
  );
  await carousel.hover();
  await page.clock.runFor(6500);
  await expect(carousel).toHaveAttribute(
    "data-slide-index",
    String((initial + 1) % 2),
  );
  await carousel.getByRole("button").focus();
  await page.mouse.move(0, 0);
  await expect(carousel).toHaveAttribute("data-autoplay", "paused");
  await page.clock.runFor(6500);
  await expect(carousel).toHaveAttribute(
    "data-slide-index",
    String((initial + 1) % 2),
  );
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.mouse.move(0, 0);
  await expect(carousel).toHaveAttribute("data-autoplay", "paused");
});

test("reduced motion keeps carousel still with manual navigation in gallery", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/#du-an");
  const carousel = page.locator('[data-carousel="riviu-manager"]');
  await carousel.scrollIntoViewIfNeeded();
  await expect(carousel).toHaveAttribute("data-autoplay", "paused");
  await page.clock.fastForward(10000);
  await expect(carousel).toHaveAttribute("data-slide-index", "0");
  await carousel.getByRole("button", { name: "Xem ảnh Riviu Manager" }).click();
  const gallery = page.getByRole("dialog", { name: "Ảnh dự án Riviu Manager" });
  await gallery
    .getByRole("button", { name: "Ảnh tiếp theo", exact: true })
    .click();
  await expect(gallery.locator("[data-modal-slide-index]")).toHaveAttribute(
    "data-modal-slide-index",
    "1",
  );
});

for (const width of [1440, 390]) {
  test(`project details animate without shifting the following content at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#du-an");
    const trigger = page.locator(
      '[data-project-details-trigger="riviu-manager"]',
    );
    await trigger.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const measure = () =>
      page.evaluate(() => ({
        y: scrollY,
        nextY:
          document
            .querySelector('[data-project-id="riviu-web"]')!
            .getBoundingClientRect().top + scrollY,
        x: document
          .querySelector('[data-project-id="riviu-manager"]')!
          .getBoundingClientRect().left,
        height: document.documentElement.scrollHeight,
      }));
    const before = await measure();
    await trigger.click();
    const modal = page.getByRole("dialog", {
      name: "Chi tiết dự án Riviu Manager",
    });
    await expect(modal).toHaveAttribute("data-phase", "open");
    await expect(modal).toHaveCSS("opacity", "1");
    const during = await measure();
    expect(during.y).toBeCloseTo(before.y, 0);
    expect(during.nextY).toBeCloseTo(before.nextY, 0);
    expect(during.x).toBeCloseTo(before.x, 0);
    expect(during.height).toBe(before.height);
    await expect(
      modal.getByRole("button", { name: "Đóng chi tiết" }),
    ).toBeFocused();
    await page.screenshot({ path: `test-results/details-modal-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
    await expect(trigger).toBeFocused();
    const after = await measure();
    expect(after).toEqual(before);
    // Closing while the entrance is still running must not reopen the dialog.
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
}

test("Da Lat label has no decorative connector on desktop or mobile", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    for (const chapter of [0, 1, 2, 3]) {
      await page
        .getByRole("combobox", { name: "Nội dung cuốn sổ" })
        .selectOption(String(chapter));
      await expect(page.locator("section[data-chapter]")).toHaveAttribute(
        "data-chapter",
        String(chapter),
      );
      const content = await page
        .locator("[data-map-label]")
        .evaluate((el) => getComputedStyle(el, "::before").content);
      expect(content).toBe("none");
      await expect(page.locator("[data-geographic-pin]")).toBeVisible();
    }
  }
});

test("all map projections share the same geographic focal point", () => {
  expect(mapAssets.maps).toHaveLength(4);
  expect(mapAssets.journeyRoute.validation.insideVietnam).toBe(true);
  for (const map of mapAssets.maps) {
    const projection = geoMercator()
      .center(map.projection.center as [number, number])
      .scale(map.projection.scale)
      .translate(map.projection.translate as [number, number]);
    const point = projection([
      mapAssets.geographicAnchor.longitude,
      mapAssets.geographicAnchor.latitude,
    ])!;
    expect(point[0] / map.width).toBeCloseTo(map.anchor.x, 5);
    expect(point[1] / map.height).toBeCloseTo(map.anchor.y, 5);
  }
  for (let step = 0; step <= 100; step++) {
    const p = step / 100;
    const pose = getCameraPose(p, mapAssets.maps);
    for (const map of mapAssets.maps) {
      const transform = getPlateTransform(p, map, mapAssets.maps);
      expect(map.anchor.x * transform.scale + transform.x / 100).toBeCloseTo(
        pose.anchor.x,
        8,
      );
      expect(map.anchor.y * transform.scale + transform.y / 100).toBeCloseTo(
        pose.anchor.y,
        8,
      );
      expect(transform.scale * map.projection.scale).toBeCloseTo(pose.scale, 5);
    }
  }
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const current = getCameraPose(i / 1000, mapAssets.maps).scale;
    expect(current).toBeGreaterThanOrEqual(previous);
    previous = current;
  }
});

test("book copy is personal and the removed source footer is absent", async ({
  page,
}) => {
  await page.goto("/");
  const scene = page.locator("[data-journey-frame]");
  await expect(scene).not.toContainText("và những tính năng dễ sử dụng");
  await expect(
    scene.getByRole("list", { name: "Công nghệ và kỹ năng" }),
  ).toHaveCount(0);
  await expect(scene.getByRole("link", { name: "Dự án chọn lọc" })).toHaveCount(
    0,
  );
  await expect(scene.getByRole("link", { name: /OpenStreetMap/ })).toHaveCount(
    0,
  );
  await expect(page.getByRole("link", { name: /OpenStreetMap/ })).toHaveCount(
    0,
  );
  expect(mapAssets.journeyRoute.coordinates[0]).toEqual([105.854, 21.029]);
  expect(mapAssets.journeyRoute.coordinates.at(-1)).toEqual([108.438, 11.941]);
});

test("published land geometry and additional zoom detail are available", async ({
  request,
}) => {
  const response = await request.get("/portfolio/vietnam-boundary.geojson");
  expect(response.ok()).toBe(true);
  const boundary = (await response.json()) as GeoPermissibleObjects;
  expect(geoContains(boundary, [108.438, 11.941])).toBe(true);
  expect(geoContains(boundary, [105.854, 21.029])).toBe(true);
  expect(geoContains(boundary, [0, 0])).toBe(false);
  expect(mapAssets.detailMaps).toHaveLength(2);
});

test("map detail transitions cover the visible page without enlarged labels", async ({
  page,
}) => {
  await page.goto("/");
  for (const p of [0.1, 0.22, 0.42, 0.55, 0.74, 0.88]) {
    await page.evaluate((progress) => {
      const s = document.querySelector("section[data-chapter]") as HTMLElement;
      window.scrollTo({
        top: progress * (s.offsetHeight - innerHeight),
        behavior: "instant",
      });
    }, p);
    await page.waitForTimeout(180);
    await expect(page.locator("[data-map-linework]")).toHaveAttribute(
      "data-label-size",
      "11",
    );
    const covered = await page.evaluate(() => {
      const book = document.querySelector("[data-book-frame]") as HTMLElement;
      const old = book.style.transform;
      book.style.transform = "none";
      const box = book.getBoundingClientRect();
      const checks = [...document.querySelectorAll("[data-layer]")]
        .filter((el) => Number(getComputedStyle(el).opacity) > 0.03)
        .map((el) => {
          const r = el.querySelector("picture")!.getBoundingClientRect();
          return (
            r.x <= box.x + box.width * 0.43 + 1 &&
            r.right >= box.right - 1 &&
            r.y <= box.y + 1 &&
            r.bottom >= box.bottom - 1
          );
        });
      book.style.transform = old;
      return checks.every(Boolean);
    });
    expect(covered).toBe(true);
    await page.screenshot({ path: `test-results/zoom-${p}.png` });
  }
});

test("Da Lat label is placed clear of Ho Chi Minh City", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const book = document.querySelector("[data-book-frame]") as HTMLElement;
    const old = book.style.transform;
    book.style.transform = "none";
    const b = book.getBoundingClientRect(),
      l = document.querySelector("[data-map-label]")!.getBoundingClientRect();
    book.style.transform = old;
    return {
      box: { x: b.x, y: b.y, width: b.width, height: b.height },
      label: { x: l.x, y: l.y, width: l.width, height: l.height },
    };
  });
  const m = mapAssets.maps[0]!;
  const projection = geoMercator()
    .center(m.projection.center as [number, number])
    .scale(m.projection.scale)
    .translate(m.projection.translate as [number, number]);
  const [x, y] = projection([106.7, 10.776])!;
  const hcm = {
    x: result.box.x + (x / m.width) * result.box.width + 5,
    y: result.box.y + (y / m.height) * result.box.height - 19,
    width: 92,
    height: 16,
  };
  const l = result.label;
  expect(
    l.x < hcm.x + hcm.width &&
      l.x + l.width > hcm.x &&
      l.y < hcm.y + hcm.height &&
      l.y + l.height > hcm.y,
  ).toBe(false);
});

test("Hanoi and Ho Chi Minh City remain named on the mobile overview", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect
    .poll(async () =>
      JSON.parse(
        (await page
          .locator("[data-map-linework]")
          .getAttribute("data-labels")) || "[]",
      ),
    )
    .toContain("Hà Nội");
  await expect
    .poll(async () =>
      JSON.parse(
        (await page
          .locator("[data-map-linework]")
          .getAttribute("data-labels")) || "[]",
      ),
    )
    .toContain("TP. Hồ Chí Minh");
});

test("no flip assets are loaded and all profile experience is two years", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await expect(page.locator("[data-page-turn], [data-curl-strip]")).toHaveCount(
    0,
  );
  await expect(
    page.locator('nav[aria-label="Các chặng hành trình"]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Nội dung cuốn sổ" }),
  ).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/3 năm|Ba năm|Năm 03/);
  expect(text).toContain("2 năm kinh nghiệm lập trình");
  expect(requests.some((url) => /turn-\d|turns\.json/.test(url))).toBe(false);
});

test("route stays thin and canvas contains visible ink through zoom", async ({
  page,
}) => {
  await page.goto("/");
  const canvas = page.locator("[data-map-linework]");
  for (const progress of [0, 0.18, 0.35, 0.48]) {
    await page.evaluate((p) => {
      const section = document.querySelector(
        "section[data-chapter]",
      ) as HTMLElement;
      window.scrollTo({
        top: p * (section.offsetHeight - innerHeight),
        behavior: "instant",
      });
    }, progress);
    await expect(canvas).toHaveAttribute("data-rendered", "true");
    await expect(canvas).toHaveAttribute("data-route-width", "1.25");
    const ink = await canvas.evaluate((element) => {
      const c = element as HTMLCanvasElement;
      const data = c
        .getContext("2d")!
        .getImageData(0, 0, c.width, c.height).data;
      let pixels = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) pixels++;
      return pixels;
    });
    expect(ink).toBeGreaterThan(10);
  }
});

test("rapid direction changes settle on the latest requested chapter", async ({
  page,
}) => {
  await page.goto("/");
  for (const p of [0.86, 0.1, 0.58, 0]) {
    await page.evaluate((progress) => {
      const section = document.querySelector(
        "section[data-chapter]",
      ) as HTMLElement;
      window.scrollTo({
        top: progress * (section.offsetHeight - innerHeight),
        behavior: "instant",
      });
    }, p);
    await page.waitForTimeout(80);
  }
  await expect(page.locator("[data-page-turn]")).toHaveCount(0);
  await expect(page.locator("section[data-chapter]")).toHaveAttribute(
    "data-chapter",
    "0",
  );
});

test("reference palette is retained on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const palette = await page.evaluate(() => ({
    paper: getComputedStyle(document.body).backgroundColor,
    ink: getComputedStyle(document.body).color,
  }));
  expect(palette).toEqual({
    paper: "rgb(236, 231, 220)",
    ink: "rgb(43, 39, 33)",
  });
});

test("the visible pin center sits on the projected geographic anchor", async ({
  page,
}) => {
  await page.goto("/");
  for (const p of [0, 0.3, 0.58, 0.86]) {
    await page.evaluate((progress) => {
      const section = document.querySelector(
        "section[data-chapter]",
      ) as HTMLElement;
      window.scrollTo({
        top: progress * (section.offsetHeight - innerHeight),
        behavior: "instant",
      });
    }, p);
    await page.waitForTimeout(1000);
    const actual = await page.evaluate(() => {
      const book = document.querySelector("[data-book-frame]") as HTMLElement;
      const old = book.style.transform;
      book.style.transform = "none";
      const bounds = book.getBoundingClientRect();
      const pin = document
        .querySelector("[data-geographic-pin]")!
        .getBoundingClientRect();
      const section = document.querySelector(
        "section[data-chapter]",
      ) as HTMLElement;
      const result = {
        x: (pin.x + pin.width / 2 - bounds.x) / bounds.width,
        y: (pin.y + pin.height / 2 - bounds.y) / bounds.height,
        progress: scrollY / (section.offsetHeight - innerHeight),
      };
      book.style.transform = old;
      return result;
    });
    const expected = getCameraPose(actual.progress, mapAssets.maps).anchor;
    expect(actual.x).toBeCloseTo(expected.x, 3);
    expect(actual.y).toBeCloseTo(expected.y, 3);
  }
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 1440, height: 768 },
  { width: 390, height: 844 },
  { width: 320, height: 740 },
]) {
  test(`first wheel zooms inside a stationary frame at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("section[data-enhanced='true']")).toBeAttached();
    await page.evaluate(() => document.fonts.ready);
    const heading = page.getByRole("heading", {
      name: "Đỗ Hiền Dinh",
      exact: true,
    });
    const header = page.getByRole("banner");
    const art = page.locator('[data-layer="vietnam"]');
    const beforeHeading = await heading.boundingBox();
    const beforeHeader = await header.boundingBox();
    const beforeMap = await art.boundingBox();
    const label = await page.locator("[data-map-label]").boundingBox();
    const book = await page.locator("[data-book-frame]").boundingBox();
    expect(label!.y + label!.height).toBeLessThan(book!.y + book!.height);
    const transform = await art.evaluate(
      (element) => getComputedStyle(element).transform,
    );
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.mouse.wheel(0, 180);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(100);
    await page.waitForTimeout(300);
    const afterHeading = await heading.boundingBox();
    const afterHeader = await header.boundingBox();
    expect(Math.abs(afterHeading!.y - beforeHeading!.y)).toBeLessThan(1);
    expect(Math.abs(afterHeader!.y - beforeHeader!.y)).toBeLessThan(1);
    expect(beforeMap!.y).toBeGreaterThan(
      beforeHeading!.y + beforeHeading!.height,
    );
    expect(beforeMap!.y + beforeMap!.height).toBeLessThan(viewport.height);
    expect(
      await art.evaluate((element) => getComputedStyle(element).transform),
    ).not.toBe(transform);
    await page.mouse.wheel(0, -180);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.screenshot({
      path: `test-results/frame-${viewport.width}-${viewport.height}.png`,
    });
  });
}

test("four chapters, reverse scroll, project disclosure and email copy", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Đỗ Hiền Dinh", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  const journey = page.locator("section[data-chapter]");
  for (const index of [0, 1, 2, 3, 1, 0]) {
    await page
      .getByRole("combobox", { name: "Nội dung cuốn sổ" })
      .selectOption(String(index));
    await expect(journey).toHaveAttribute("data-chapter", String(index));
    await page.waitForTimeout(700);
    await expect(page.locator("[data-page-turn]")).toHaveCount(0);
    await page.screenshot({ path: `test-results/chapter-${index}.png` });
  }
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("link", { name: "Dự án", exact: true })
    .click();
  await page.locator("[data-project-details-trigger]").first().click();
  const details = page.getByRole("dialog", {
    name: "Chi tiết dự án Riviu Manager",
  });
  await expect(details).toHaveAttribute("data-phase", "open");
  await details
    .getByRole("button", { name: "Đóng chi tiết", exact: true })
    .click();
  await expect(details).not.toBeVisible();
  await page
    .getByRole("button", { name: "Sao chép email", exact: true })
    .click();
  await expect(page.locator("#lien-he").getByRole("status")).toContainText(
    "Đã sao chép",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "dohiendinh.work@gmail.com",
  );
  expect(errors).toEqual([]);
});

for (const width of [1440, 768, 390, 320]) {
  test(`layout fits ${width}px, media render and each chapter is readable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width > 640 ? 1000 : 844 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('[data-layer="vietnam"] img')).toBeVisible();
    expect(
      await page
        .locator('[data-layer="vietnam"] img')
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0);
    for (const index of [0, 1, 2, 3]) {
      await page
        .getByRole("combobox", { name: "Nội dung cuốn sổ" })
        .selectOption(String(index));
      await expect(page.locator("section[data-chapter]")).toHaveAttribute(
        "data-chapter",
        String(index),
      );
      await page.waitForTimeout(450);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.screenshot({
      path: `test-results/layout-${width}.png`,
      fullPage: true,
    });
  });
}

test("reduced motion exposes all chapter information without a scroll trap", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const journey = page.locator("section[data-chapter]");
  await expect(journey).toHaveAttribute("data-static", "true");
  await expect(journey.locator("article")).toHaveCount(3);
  await expect(journey.locator("article").last()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Chặng tiếp theo", exact: true }),
  ).not.toBeVisible();
});

test("server HTML is readable with JavaScript disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.PORTFOLIO_URL ?? "http://localhost:3000");
  await expect(
    page.getByRole("heading", { name: "Đỗ Hiền Dinh", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator("section[data-enhanced='false'] article"),
  ).toHaveCount(3);
  const details = page.locator("#du-an details").first();
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await context.close();
});

test("failed map request retains readable information", async ({ page }) => {
  await page.route("**/portfolio/map-*", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Đỗ Hiền Dinh", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-layer="vietnam"]')).toContainText(
    "Việt Nam",
  );
  await expect(page.locator("[data-project-details-trigger]")).toHaveCount(2);
});

test("short landscape viewport uses normal document flow", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await expect(page.locator("section[data-static='true']")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("direct project hash remains correct after hydration", async ({
  page,
}) => {
  await page.goto("/#du-an");
  await expect(page.locator("section[data-enhanced='true']")).toBeAttached();
  await page.waitForTimeout(800);
  const top = await page
    .locator("#du-an")
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThan(250);
});

test("the pinned frame exits after the final chapter and the top link resets it", async ({
  page,
}) => {
  await page.goto("/");
  const frame = page.locator("[data-journey-frame]");
  await page
    .getByRole("combobox", { name: "Nội dung cuốn sổ" })
    .selectOption("3");
  await expect(page.locator("section[data-chapter]")).toHaveAttribute(
    "data-chapter",
    "3",
  );
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const section = document.querySelector(
      "section[data-chapter]",
    ) as HTMLElement;
    window.scrollTo({
      top: section.offsetHeight - innerHeight,
      behavior: "instant",
    });
  });
  expect(Math.abs((await frame.boundingBox())!.y)).toBeLessThan(1);
  await page.mouse.wheel(0, 350);
  await expect
    .poll(async () => (await frame.boundingBox())!.y)
    .toBeLessThan(-200);
  await page.getByRole("link", { name: "Về đầu trang", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator("section[data-chapter]")).toHaveAttribute(
    "data-chapter",
    "0",
  );
});

for (const viewport of [
  { width: 800, height: 700 },
  { width: 1440, height: 768 },
]) {
  test(`book text fits at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    if (viewport.height <= 700)
      await expect(page.locator("section[data-static='true']")).toBeVisible();
    for (let index = 0; index < (viewport.height <= 700 ? 1 : 4); index++) {
      if (viewport.height > 700) {
        await page
          .getByRole("combobox", { name: "Nội dung cuốn sổ" })
          .selectOption(String(index));
        await expect(page.locator("section[data-chapter]")).toHaveAttribute(
          "data-chapter",
          String(index),
        );
      }
      const overflow = await page
        .locator('[data-current="true"]')
        .evaluate((element) => {
          const paragraph = element.querySelector("p")!;
          return (
            paragraph.getBoundingClientRect().bottom >
            element.getBoundingClientRect().bottom
          );
        });
      expect(overflow).toBe(false);
    }
    if (viewport.height <= 700)
      await expect(
        page.locator("section[data-static='true'] article"),
      ).toHaveCount(3);
    await page.screenshot({
      path: `test-results/compact-${viewport.width}.png`,
    });
  });
}
