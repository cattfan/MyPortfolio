import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fixtureRevision, sheets, partnerNames, posts, columns, rows, summaryColumns, summaryRows, totals, photos, devices, createFlow, validateFixtures } from "./manager-reports-fixtures.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const desktop = path.dirname(root);
const managerRoot = process.env.MANAGER_SOURCE || path.join(desktop, "Riviu_managers_phone");
const reportsRoot = process.env.REPORTS_SOURCE || path.join(desktop, "Riviu_reports");
const require = createRequire(path.join(root, "apps/web/package.json"));
const { chromium } = require("@playwright/test");
const sharp = require("sharp");
const port = Number(process.env.MANAGER_CAPTURE_PORT || 1421);
const viewport = { width: 1440, height: 900 };
const output = path.join(root, "apps/web/public/projects");
const fixtureSummary = validateFixtures();
console.log(`FIXTURES_PASS: ${JSON.stringify(fixtureSummary)}`);
if (process.argv.includes("--validate-fixtures")) process.exit(0);

function reportsFixture(url) {
  const pathname = url.pathname;
  if (pathname === "/api/version") return { proxyTestBuild: "portfolio-demo-20260907" };
  if (pathname === "/list-files") return {
    files: [{ id: "riviu-demo.xlsx", label: "Riviu Đà Lạt · 08.2026" }], current: "riviu-demo.xlsx",
    currentSheet: sheets[0], scanSheet: sheets[0], sheets,
    googleSheetUrl: "", googlePushReady: false, googleOAuthAuthorized: false,
  };
  if (pathname === "/google-oauth-status") return { configured: true, valid: false, authorized: false };
  if (pathname === "/proxy-list") return { text: "", count: 0, samples: [] };
  if (pathname === "/preview-excel") return {
    file: "riviu-demo.xlsx", fileLabel: "Riviu Đà Lạt · 08.2026",
    currentSheet: url.searchParams.get("sheet_name") || sheets[0], sheets, columns, data: rows,
  };
  if (pathname === "/summary-dashboard") return {
    sheet: sheets[1], columns: summaryColumns, rows: summaryRows, totals: { partners: partnerNames.length, ...totals },
  };
  return null;
}

function gitState(dir) {
  return {
    commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim(),
    status: execFileSync("git", ["status", "--porcelain"], { cwd: dir, encoding: "utf8" }),
  };
}

async function sourceHashes(dir, files) {
  return Object.fromEntries(await Promise.all(files.map(async (file) => [file,
    createHash("sha256").update(await readFile(path.join(dir, file))).digest("hex")])));
}

async function prepareDeviceFrames() {
  const target = path.join(output, "riviu-manager", "demo-assets");
  await mkdir(target, { recursive: true });
  for (const photo of photos) {
    const file = path.join(target, photo.file);
    try { await readFile(file); } catch {
      const response = await fetch(photo.url);
      assert.ok(response.ok, `Photo download failed: ${photo.file}`);
      await writeFile(file, Buffer.from(await response.arrayBuffer()));
    }
    assert.ok((await sharp(file).metadata()).width > 300);
  }
  const frames = [];
  for (const [index, device] of devices.entries()) {
    const caption = Buffer.from(`<svg width="400" height="800" xmlns="http://www.w3.org/2000/svg"><rect y="610" width="400" height="190" fill="#13251f" fill-opacity=".85"/><g fill="#fff" font-family="Arial, sans-serif"><text x="26" y="650" font-size="15">BỘ SƯU TẬP ĐÀ LẠT</text><text x="26" y="691" font-size="23" font-weight="700">${device.title}</text><text x="26" y="725" font-size="15">${device.model} · Ảnh ${index + 1}/6</text><text x="26" y="760" font-size="12" fill="#ced9d1">NỘI DUNG DEMO / THÁNG 08.2026</text></g></svg>`);
    const bytes = await sharp(path.join(target, device.photo)).resize(400, 800, { fit: "cover", position: index > 2 ? "east" : "centre" }).composite([{ input: caption }]).jpeg({ quality: 90 }).toBuffer();
    await writeFile(path.join(target, `device-${index + 1}.jpg`), bytes);
    frames.push({ udid: device.udid, bytes });
  }
  const template = await sharp(frames[0].bytes).extract({ left: 0, top: 610, width: 400, height: 120 }).resize(200, 60).png().toBuffer();
  await writeFile(path.join(target, "home-template.png"), template);
  return { frames, templatePngBase64: template.toString("base64") };
}

async function installPortfolioMock(page, flow) {
  await page.addInitScript(({ roster, document }) => {
    let internals = window.__TAURI_INTERNALS__;
    const wrap = (value) => {
      if (!value?.invoke || value.__portfolioWrapped) return value;
      const invoke = value.invoke;
      return { ...value, __portfolioWrapped: true, invoke: async (command, args) => {
        if (["list_devices", "refresh_devices"].includes(command)) return structuredClone(roster);
        if (command === "view_endpoint") return `ws://${location.host}/portfolio-demo-view`;
        if (command === "flow_list") return [{ id: document.id, name: document.name, latestRevision: document.revision, nodeCount: document.nodes.length, createdAt: "2026-08-31T11:00:00Z", updatedAt: "2026-08-31T11:00:00Z" }];
        if (command === "flow_get") return { document: structuredClone(document), compiledPlan: {}, planHash: "d".repeat(64), createdAt: "2026-08-31T11:00:00Z" };
        if (command === "flow_action_catalog") {
          const catalog = await invoke(command, args);
          return catalog.map((item) => item.kind === "ifVision" ? { ...item, outputPorts: ["matched", "notMatched"].map((name) => ({ name, valueType: "flow", required: true })) } : item);
        }
        return invoke(command, args);
      } };
    };
    internals = wrap(internals);
    Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, get: () => internals, set: (value) => { internals = wrap(value); } });
  }, { roster: devices, document: flow });
}

async function save(page, project, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1430, 890);
  await page.waitForTimeout(500);
  const target = path.join(output, project);
  await mkdir(target, { recursive: true });
  const png = path.join(target, `${name}.png`);
  await page.screenshot({ path: png, animations: "disabled" });
  await sharp(png).resize({ width: 1920 }).webp({ quality: 92, effort: 6 }).toFile(path.join(target, `${name}.webp`));
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.width, 2880);
  assert.equal(metadata.height, 1800);
  const stats = await sharp(png).stats();
  assert.ok(stats.channels.some((channel) => channel.stdev > 15), "Screenshot must not be blank");
  console.log(`CAPTURE_OK ${project}/${name} 2880x1800 PNG; 1920x1200 WebP`);
}

const managerFiles = ["apps/desktop/package.json", "apps/desktop/src/App.tsx", "apps/desktop/e2e/fixtures/tauriMock.ts"];
const reportsFiles = ["templates/index.html", "static/styles.css", "static/app.js", "requirements.txt", "package.json"];
const before = {
  manager: { ...gitState(managerRoot), sha256: await sourceHashes(managerRoot, managerFiles) },
  reports: { ...gitState(reportsRoot), sha256: await sourceHashes(reportsRoot, reportsFiles) },
};
const errors = [];
const streamTimers = new Set();
const managerDir = path.join(managerRoot, "apps/desktop");
const managerRequire = createRequire(path.join(managerDir, "package.json"));
const vitePackage = managerRequire.resolve("vite/package.json");
const vite = spawn(process.execPath, [path.join(path.dirname(vitePackage), "bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
  cwd: managerDir, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
});
let viteLogs = "";
vite.stdout.on("data", (chunk) => { viteLogs += chunk; });
vite.stderr.on("data", (chunk) => { viteLogs += chunk; });
const reports = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    if (request.method !== "GET") { response.writeHead(405).end(); return; }
    const fixture = reportsFixture(url);
    if (fixture) { response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(fixture)); return; }
    const staticFiles = { "/static/styles.css": ["static/styles.css", "text/css"], "/static/app.js": ["static/app.js", "text/javascript"], "/logo.png": ["logo.png", "image/png"] };
    if (url.pathname === "/") {
      const template = await readFile(path.join(reportsRoot, "templates/index.html"), "utf8");
      const html = template.replaceAll("{{ asset_version }}", "portfolio-demo-20260907");
      assert.ok(!html.includes("{{"), "All template expressions must be resolved");
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(html);
    } else if (staticFiles[url.pathname]) {
      const [file, type] = staticFiles[url.pathname];
      response.writeHead(200, { "Content-Type": `${type}; charset=utf-8` }).end(await readFile(path.join(reportsRoot, file)));
    } else if (url.pathname === "/favicon.ico") response.writeHead(204).end();
    else { errors.push(`Unexpected Reports request ${url.pathname}`); response.writeHead(404).end(); }
  } catch (error) { errors.push(String(error)); response.writeHead(500).end(); }
});
let browser;
try {
  await new Promise((resolve) => reports.listen(0, "127.0.0.1", resolve));
  for (let retry = 0; retry < 60; retry += 1) {
    if (vite.exitCode !== null) throw new Error(`Vite exited: ${viteLogs}`);
    try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (retry === 59) throw new Error(`Vite did not start: ${viteLogs}`);
  }
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
  const managerPage = await context.newPage();
  managerPage.on("pageerror", (error) => errors.push(`Manager: ${error.message}`));
  const { installTauriMock } = await import(pathToFileURL(path.join(managerDir, "e2e/fixtures/tauriMock.ts")).href);
  const { encodeViewEnvelope } = await import(pathToFileURL(path.join(managerDir, "src/viewProtocol.ts")).href);
  const { frames, templatePngBase64 } = await prepareDeviceFrames();
  const flow = createFlow(templatePngBase64);
  await installTauriMock(managerPage, { fleetSize: 6 });
  await installPortfolioMock(managerPage, flow);
  await managerPage.routeWebSocket("**/portfolio-demo-view", (socket) => {
    const paint = () => frames.forEach(({ udid, bytes }) => socket.send(Buffer.from(encodeViewEnvelope({ kind: "jpeg", key: true, generation: 1, width: 400, height: 800, udid, payload: bytes }))));
    const timer = setInterval(paint, 800);
    streamTimers.add(timer);
    socket.onClose(() => { clearInterval(timer); streamTimers.delete(timer); });
    setTimeout(paint, 200);
  });
  await managerPage.goto(`http://127.0.0.1:${port}`, { waitUntil: "networkidle" });
  await managerPage.waitForFunction(() => document.querySelectorAll('[data-testid="device-tile"]').length === 6);
  await managerPage.waitForFunction(() => [...document.querySelectorAll("canvas.phone-canvas")].filter((canvas) => canvas.width === 400 && canvas.height === 800).length === 6);
  for (const tile of await managerPage.locator('[data-testid="device-tile"]').all()) {
    const pixels = await tile.screenshot();
    const statistics = await sharp(pixels).stats();
    assert.ok(statistics.channels.every((channel) => channel.stdev > 35), "Each device fixture must show decoded photo detail");
  }
  await save(managerPage, "riviu-manager", "overview");
  await managerPage.getByRole("button", { name: "Flow", exact: true }).click();
  await managerPage.getByRole("button", { name: "Chạy Flow", exact: true }).waitFor();
  await managerPage.waitForFunction(() => !document.querySelector(".loading-state"));
  await managerPage.getByRole("button", { name: "Bật/tắt bảng hành động", exact: true }).click();
  await managerPage.getByRole("button", { name: "Bật/tắt bảng thuộc tính", exact: true }).click();
  const fitView = managerPage.locator(".react-flow__controls-fitview");
  if (await fitView.count()) await fitView.click();
  await managerPage.locator('.react-flow__node[data-id="00000000-0000-0000-0000-000000000103"]').click();
  assert.equal(await managerPage.locator(".react-flow__node").count(), flow.nodes.length);
  await save(managerPage, "riviu-manager", "detail");
  const managerCommands = await managerPage.evaluate(() => window.__RIVIU_TEST__.calls().map((call) => call.command));
  assert.ok(!managerCommands.some((command) => ["flow_run", "nurture_start", "interaction_start"].includes(command)), "Capture must not start device workflows");

  const reportsPage = await context.newPage();
  reportsPage.on("pageerror", (error) => errors.push(`Reports: ${error.message}`));
  await reportsPage.routeWebSocket("**/ws", (socket) => {
    setTimeout(() => socket.send(JSON.stringify({ type: "status", data: { total: posts.length, processed: posts.length, success: posts.length, hidden: 0, error: 0, done: true, workers: 10 } })), 300);
  });
  await reportsPage.goto(`http://127.0.0.1:${reports.address().port}`, { waitUntil: "networkidle" });
  await reportsPage.waitForFunction((length) => document.querySelectorAll("#previewBody tr").length === length, posts.length);
  await reportsPage.waitForFunction(() => document.querySelector("#progressStatus").textContent === "Thành công");
  await save(reportsPage, "riviu-reports", "overview");
  await reportsPage.getByRole("button", { name: sheets[1], exact: true }).click();
  await reportsPage.waitForFunction(() => document.querySelectorAll(".summary-table tbody tr").length === 8);
  await save(reportsPage, "riviu-reports", "detail");
  const after = {
    manager: { ...gitState(managerRoot), sha256: await sourceHashes(managerRoot, managerFiles) },
    reports: { ...gitState(reportsRoot), sha256: await sourceHashes(reportsRoot, reportsFiles) },
  };
  assert.deepEqual(after, before, "Source repo tracked state and inspected file hashes must be unchanged");
  assert.deepEqual(errors, [], "No page errors or unexpected Reports requests");
  for (const [project, source, sourceRepo, captions] of [
    ["riviu-manager", "manager", "https://github.com/Riviudalat/Riviu_managers_phone", ["Quản lý sáu thiết bị demo", "Trình biên tập Flow"]],
    ["riviu-reports", "reports", "https://github.com/Riviudalat/Riviu_reports", ["Bảng dữ liệu bài đăng", "Tổng kết theo đối tác"]],
  ]) {
    await writeFile(path.join(output, project, "capture.json"), JSON.stringify({
      sourceRepo, sourceCommit: before[source].commit, sourceDirty: Boolean(before[source].status), sourceSha256: before[source].sha256,
      capturedAt: new Date().toISOString(), viewport, deviceScaleFactor: 2, dataMode: "demo", sourceUnchanged: true,
      fixtureRevision, fixtureSummary,
      method: source === "manager" ? "Actual Vite desktop frontend + existing Tauri mock extended with six named devices and branched Flow; JPEG fixtures decoded through original view worker/protocol; no native shell" : "Unmodified HTML/CSS/JS served by isolated read-only HTTP fixture; 24 linked posts and 8 partner totals computed from same source rows; no production backend/database",
      photoSources: source === "manager" ? photos : undefined,
      screenshots: ["overview", "detail"].map((name, i) => ({ name, caption: captions[i], png: { width: 2880, height: 1800 }, webp: { width: 1920, height: 1200 }, disclosure: "Ảnh chụp với dữ liệu demo" })),
      pageErrors: errors,
    }, null, 2) + "\n");
  }
  console.log("CAPTURE_PASS: 4 real-UI screenshots; source repos unchanged; no page errors; demo fixtures only.");
} finally {
  for (const timer of streamTimers) clearInterval(timer);
  if (browser) await browser.close();
  await new Promise((resolve) => reports.close(resolve));
  if (vite.exitCode === null) {
    vite.kill();
    await new Promise((resolve) => vite.once("exit", resolve));
  }
}
