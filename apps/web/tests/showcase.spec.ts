import { expect, test } from "@playwright/test";
import { projects } from "../content/portfolio";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("portfolio-language", "vi"),
  );
});

test("project cards use thumbnails inside window frames; the gallery keeps originals", async ({
  page,
}) => {
  await page.goto("/#du-an");
  for (const project of projects) {
    const article = page.locator(`[data-project-id="${project.id}"]`);
    await expect(article.locator("[data-window]")).toContainText(
      project.liveUrl ? new URL(project.liveUrl).hostname : project.name,
    );
    // The carousel swaps its fallback link for a button after hydration, which
    // remounts the images; read them once the enhanced button is in place.
    const card = article.locator("[data-carousel] > button img").first();
    await expect(card).toBeAttached();
    await card.scrollIntoViewIfNeeded();
    await expect
      .poll(() => card.evaluate((img) => (img as HTMLImageElement).currentSrc))
      .toContain(project.screenshots[0]!.card);
    expect(
      await card.evaluate((img) => (img as HTMLImageElement).naturalWidth),
    ).toBeLessThanOrEqual(1100);
  }
  await page
    .getByRole("button", { name: "Xem ảnh Riviu Web", exact: true })
    .click();
  const gallery = page.getByRole("dialog", { name: "Ảnh dự án Riviu Web" });
  await expect(gallery.getByRole("img")).toHaveAttribute(
    "src",
    projects[1]!.screenshots[0]!.src,
  );
});

test("social previews use a large image card", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const image = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(image).toContain("opengraph-image.jpg");
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    "content",
    "1200",
  );
  const response = await request.get(new URL(image!).pathname);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/jpeg");
});

test("the footer credits map data and artwork in both languages", async ({
  page,
}) => {
  await page.goto("/");
  const credits = page.locator("footer p");
  await expect(credits).toContainText("Nguồn bản đồ và hình nền:");
  await expect(
    credits.getByRole("link", { name: "© OpenStreetMap contributors" }),
  ).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
  // The watercolor wash and paper texture are MIT-licensed ThreeUI artwork.
  await expect(
    credits.getByRole("link", { name: "ThreeUI Sketchbook (MIT)" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/MengTo/threeui/blob/main/LICENSE",
  );
  await page.locator("[data-language-toggle]").click();
  await expect(credits).toContainText("Map and artwork sources:");
});

test("the compact mobile menu opens, closes and returns focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  // Escape and outside clicks close the menu only once the page has hydrated.
  await expect(page.locator("[data-language-toggle]")).toBeEnabled();
  const header = page.getByRole("banner");
  const toggle = header.locator("details summary");
  const nav = header.getByRole("navigation", { name: "Điều hướng chính" });
  await expect(nav).toBeHidden();
  // An outside tap that lands before the asynchronous toggle event still closes it.
  expect(
    await page.evaluate(() => {
      const menu = document.querySelector<HTMLDetailsElement>(
        "[data-site-header] details",
      );
      menu?.querySelector("summary")?.click();
      document.querySelector("main")?.click();
      return menu?.open;
    }),
  ).toBe(false);
  await toggle.click();
  await expect(nav).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await expect(nav).toBeVisible();
  await page.mouse.click(195, 600);
  await expect(nav).toBeHidden();
});

test("a direct section link upgrades to the journey once back at the top", async ({
  page,
}) => {
  await page.goto("/#du-an");
  const journey = page.locator("section[data-chapter]");
  await page.waitForTimeout(800);
  await expect(journey).toHaveAttribute("data-enhanced", "false");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(journey).toHaveAttribute("data-enhanced", "true");
  await expect(journey).toHaveAttribute("data-static", "false");
});

test("the 404 page carries a single noindex directive", async ({ page }) => {
  const response = await page.goto("/khong-ton-tai");
  expect(response?.status()).toBe(404);
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveCount(1);
  await expect(robots).toHaveAttribute("content", /noindex/);
});

test("language: /en serves English HTML, metadata and structured data", async ({
  page,
  request,
}) => {
  // The server HTML itself is English, before any script runs.
  const html = await (await request.get("/en")).text();
  expect(html).toContain("Skip to projects");
  expect(html).not.toContain("Đến dự án");
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://cattfan.site/en",
  );
  await expect(
    page.locator('link[rel="alternate"][hreflang="vi"]'),
  ).toHaveAttribute("href", "https://cattfan.site");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "en_US",
  );
  const person = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "{}",
  );
  expect(person).toMatchObject({
    "@type": "Person",
    name: "Đỗ Hiền Dinh",
    jobTitle: "Freelance Software Engineer",
  });
  // A Vietnamese preference saved earlier does not override an English link.
  await page.evaluate(() => localStorage.setItem("portfolio-language", "vi"));
  await page.reload();
  await expect(page.getByRole("heading", { level: 2 }).first()).not.toHaveText(
    /Lập trình/,
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("language: the address follows the language toggle", async ({ page }) => {
  await page.goto("/#du-an");
  await page.locator("[data-language-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveURL(/\/en#du-an$/);
  await page.locator("[data-language-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page).toHaveURL(/\/#du-an$/);
});

test("projects are one tap away from the hero and the phone header", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator("[data-journey-frame]").getByRole("link", {
    name: "Xem dự án",
  });
  await expect(hero).toHaveAttribute("href", "#du-an");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(hero).toBeHidden();
  const shortcut = page.getByRole("banner").getByRole("link", {
    name: "Dự án",
    exact: true,
  });
  await expect(shortcut.filter({ visible: true })).toHaveCount(1);
});
