import { expect, test } from "@playwright/test";

test.describe("static production hardening", () => {
  test.skip(
    process.env.PORTFOLIO_STATIC !== "1",
    "Runs against the hardened static container",
  );
  test("serves security headers and rejects private paths and writes", async ({
    request,
  }) => {
    const home = await request.get("/");
    expect(home.status()).toBe(200);
    const headers = home.headers();
    expect(headers["x-powered-by"]).toBeUndefined();
    expect(headers["server"]).not.toMatch(/\d/);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["content-security-policy"]).toContain("'sha256-");
    expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
    for (const path of [
      "/.env",
      "/.git/config",
      "/package.json",
      "/note/code.md",
      "/projects/riviu-reports/overview.webp",
      "/projects/shop-of-catt/live-overview.webp",
      "/projects/riviu-manager/capture.json",
      "/portfolio/terrain-sources.json",
      "/portfolio/dalat-osm.json",
      "/_next/static/source.js.map",
    ]) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
    expect((await request.post("/", { data: "test" })).status()).toBe(405);
    expect((await request.get("/healthz")).status()).toBe(200);
  });
  for (const width of [1440, 390]) {
    test(`normal flows have no console errors, warnings, failed assets or CSP violations at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      const issues: string[] = [];
      page.on("pageerror", (error) => issues.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type()))
          issues.push(`${message.type()}: ${message.text()}`);
      });
      page.on("requestfailed", (request) =>
        issues.push(
          `requestfailed: ${request.url()} ${request.failure()?.errorText}`,
        ),
      );
      page.on("response", (response) => {
        if (response.status() >= 400)
          issues.push(`${response.status()} ${response.url()}`);
      });
      await page.goto("/");
      await expect(page.locator("section[data-enhanced=true]")).toBeAttached();
      for (const chapter of [0, 1, 2, 3]) {
        await page
          .getByRole("combobox", { name: "Nội dung cuốn sổ" })
          .selectOption(String(chapter));
        await page.waitForTimeout(650);
      }
      await page.locator("[data-project-details-trigger]").first().click();
      await expect(page.locator("dialog[open]")).toHaveAttribute(
        "data-phase",
        "open",
      );
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Xem ảnh Riviu Manager", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Ảnh tiếp theo", exact: true })
        .click();
      await page.waitForTimeout(750);
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      await page.locator("[data-language-toggle]").click();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await page.locator('[data-header-copy="email"]').click();
      await expect(page.getByRole("banner").getByRole("status")).toContainText(
        "dohiendinh.work@gmail.com",
      );
      await page.waitForTimeout(1500);
      expect(issues).toEqual([]);
    });
  }
});
