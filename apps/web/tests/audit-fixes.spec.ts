import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 390, height: 667 },
  { width: 375, height: 700 },
  { width: 820, height: 720 },
  { width: 390, height: 781 },
  { width: 820, height: 811 },
]) {
  for (const language of ["vi", "en"]) {
    test(`khung sách không che nội dung tại ${viewport.width}x${viewport.height} ${language}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((value) => localStorage.setItem("portfolio-language", value), language);
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      await expect(page.locator("section[data-enhanced]")).toHaveAttribute("data-enhanced", "true");
      const journey = page.locator("section[data-chapter]");
      const isStatic = (await journey.getAttribute("data-static")) === "true";
      const select = journey.locator("select");
      for (const chapter of isStatic ? [0] : [0, 1, 2, 3]) {
        if (!isStatic) {
          await select.selectOption(String(chapter));
          await expect(journey).toHaveAttribute("data-chapter", String(chapter));
        }
        const geometry = await journey.evaluate((section) => {
          const headerBottom = document.querySelector("header")!.getBoundingClientRect().bottom;
          const heading = section.querySelector("h1")!;
          const subtitle = heading.previousElementSibling!;
          const introTop = subtitle.getBoundingClientRect().top;
          const controls = [...section.querySelectorAll("select, button")].filter((el) => getComputedStyle(el).visibility !== "hidden" && el.getBoundingClientRect().height > 0).map((el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom };
          });
          return { headerBottom, introTop, controls, viewportHeight: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth };
        });
        expect(geometry.overflow).toBe(false);
        expect(geometry.introTop).toBeGreaterThanOrEqual(geometry.headerBottom - 1);
        if (!isStatic) {
          expect(geometry.controls.length).toBe(3);
          expect(geometry.controls.every((r) => r.top >= geometry.headerBottom && r.bottom <= geometry.viewportHeight)).toBe(true);
        }
      }
      if (isStatic) {
        await expect(select).not.toBeVisible();
        const articles = journey.locator("article");
        await expect(articles).toHaveCount(3);
        for (const article of await articles.all()) await expect(article).toBeVisible();
      }
    });
  }
}

for (const width of [320, 390, 640, 641, 1440]) {
  test(`cold load chỉ tải đúng overview tại ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const maps: string[] = [];
    page.on("request", (request) => {
      if (/\/map-.*\.webp/.test(request.url())) maps.push(new URL(request.url()).pathname);
    });
    await page.goto("/");
    await expect(page.locator('[data-layer="vietnam"]')).toHaveAttribute("data-ready", "true");
    const expected = width <= 640 ? "/portfolio/map-vietnam-mobile.webp" : "/portfolio/map-vietnam.webp";
    expect(maps).toEqual([expected]);
    expect(await page.locator('[data-layer="vietnam"] img').evaluate((img) => new URL((img as HTMLImageElement).currentSrc).pathname)).toBe(expected);
  });
}

test("GeoJSON production có MIME và gzip đúng", async ({ request }) => {
  test.skip(process.env.PORTFOLIO_STATIC !== "1", "Cần static Nginx");
  const response = await request.get("/portfolio/vietnam-boundary.geojson", { headers: { "Accept-Encoding": "gzip" } });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/geo+json");
  expect(response.headers()["content-encoding"]).toBe("gzip");
  expect(response.headers()["vary"]).toContain("Accept-Encoding");
  expect((await response.json()).type).toBe("Feature");
});

for (const mode of ["disabled", "failed"] as const) {
  test(`HTML vẫn dùng được khi JavaScript ${mode}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: mode !== "disabled", viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    if (mode === "failed") await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto(baseURL!);
    const journey = page.locator("section[data-chapter]");
    for (const article of await journey.locator("article").all()) await expect(article).toBeVisible();
    expect(await journey.evaluate((el) => getComputedStyle(el.firstElementChild!).position)).not.toBe("sticky");
    await expect(page.locator("[data-language-toggle]")).toBeDisabled();
    await expect(page.locator('[data-header-copy="email"]')).toBeDisabled();
    const details = page.locator("#du-an details").first();
    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");
    await expect(details.getByRole("heading", { name: "Bài toán", exact: true })).toBeVisible();
    await expect(page.locator('[data-carousel="riviu-manager"] a[href*="overview.webp"]')).toBeVisible();
    await expect(page.locator('#lien-he a[href^="mailto:"]')).toHaveCount(1);
    await context.close();
  });
}

test("hydration muộn không đóng disclosure hoặc đổi vị trí đang đọc", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/_next/static/**/*.js", async (route) => { await gate; await route.continue(); });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "commit" });
  const details = page.locator("#du-an details").first();
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  const before = await details.evaluate((el) => el.getBoundingClientRect().top);
  release();
  await expect(page.locator("[data-language-toggle]")).toBeEnabled();
  await expect(details).toHaveAttribute("open", "");
  await expect.poll(() => details.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThan(before - 2);
  expect(await details.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(before + 2);
  expect(errors).toEqual([]);
});

test("dừng carousel vẫn giữ ảnh khi người dùng rời focus và đổi ngôn ngữ", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#du-an");
  const carousel = page.locator('[data-carousel="riviu-manager"]');
  await carousel.scrollIntoViewIfNeeded();
  const pause = page.getByRole("button", { name: "Dừng chuyển ảnh Riviu Manager", exact: true });
  await pause.focus();
  const focusedIndex = await carousel.getAttribute("data-slide-index");
  await page.clock.runFor(5100);
  await expect(carousel).toHaveAttribute("data-slide-index", focusedIndex!);
  await pause.click();
  await page.getByRole("link", { name: "Liên hệ", exact: true }).focus();
  await page.mouse.move(0, 0);
  const index = await carousel.getAttribute("data-slide-index");
  for (let i = 0; i < 3; i++) {
    await page.clock.runFor(5100);
    await expect(carousel).toHaveAttribute("data-slide-index", index!);
  }
  await page.locator("[data-language-toggle]").click();
  await page.clock.runFor(500);
  const resume = page.getByRole("button", { name: "Resume slideshow Riviu Manager", exact: true });
  await expect(resume).toBeVisible();
  await page.clock.runFor(5100);
  await expect(carousel).toHaveAttribute("data-slide-index", index!);
  await resume.focus();
  await expect(carousel).toHaveAttribute("data-autoplay", "paused");
  await resume.click();
  await page.getByRole("link", { name: "Contact", exact: true }).focus();
  await page.mouse.move(0, 0);
  await expect(carousel).toHaveAttribute("data-autoplay", "running");
  await page.clock.runFor(1);
  const resumedAt = await carousel.getAttribute("data-slide-index");
  await page.clock.runFor(4800);
  await expect(carousel).toHaveAttribute("data-slide-index", resumedAt!);
  await page.clock.runFor(200);
  await expect(carousel).toHaveAttribute("data-slide-index", String((Number(resumedAt) + 1) % 2));
});
