import assert from "node:assert/strict";

export const fixtureRevision = 2;
export const sheets = ["Đà Lạt • 08.2026", "Tổng kết Đà Lạt • 08.2026"];
export const partnerNames = ["Mây Coffee", "Nhà Của Gió", "Dalat Garden", "Bếp Thông", "Tiệm Mùa Hè", "Lá Homestay", "Góc Phố", "An Nhiên"];
const partnerSlugs = ["may-coffee", "nha-cua-gio", "dalat-garden", "bep-thong", "tiem-mua-he", "la-homestay", "goc-pho", "an-nhien"];
const contentTitles = ["Cà phê sớm giữa rừng thông", "Căn phòng đón nắng đầu ngày", "Một chiều bên hồ Tuyền Lâm", "Bữa tối ấm trong căn bếp nhỏ", "Góc vườn cho buổi hẹn cuối tuần", "Hai ngày nghỉ giữa thiên nhiên", "Dạo phố Đà Lạt cuối chiều", "Sáng bình yên trên đồi"];
const postCounts = [4, 3, 3, 2, 3, 2, 3, 4];
export const posts = postCounts.flatMap((count, index) => Array.from({ length: count }, (_, post) => ({
  id: `DL26-${String(index * 10 + post + 1).padStart(3, "0")}`,
  partner: partnerNames[index],
  title: post === 0 ? contentTitles[index] : `${["Review", "Trải nghiệm", "Check-in"][post - 1]} ${partnerNames[index]}`,
  link: `https://demo.example/posts/${partnerSlugs[index]}/${post + 1}`,
  views: [68420, 48260, 82540, 32680, 51720, 28540, 39860, 61280][index] + post * (2380 + index * 163),
  likes: [4820, 3296, 6472, 2465, 3848, 1826, 2580, 4469][index] + post * (187 + index * 13),
  comments: [142, 98, 216, 86, 124, 65, 94, 158][index] + post * (11 + index),
  saves: [896, 752, 1234, 428, 693, 514, 637, 845][index] + post * (73 + index * 7),
  shares: [246, 174, 348, 112, 215, 126, 163, 228][index] + post * (19 + index),
  published: `2026-08-${String(14 + index + post).padStart(2, "0")}`,
  updated: `31/08/2026 ${String(17 + Math.floor(index / 4)).padStart(2, "0")}:${String(10 + index * 4 + post).padStart(2, "0")}`,
}))).sort((a, b) => a.id.slice(-1).localeCompare(b.id.slice(-1)) || b.views - a.views);
const number = (value) => value.toLocaleString("vi-VN");
export const columns = ["STT", "ĐỐI TÁC", "NỘI DUNG", "LINK BÀI ĐĂNG", "LƯỢT XEM", "TIM", "BÌNH LUẬN", "LƯỢT LƯU", "CHIA SẺ"];
export const rows = posts.map((post, index) => ({
  STT: index + 1, "ĐỐI TÁC": post.partner, "NỘI DUNG": post.title, "LINK BÀI ĐĂNG": post.link,
  "LƯỢT XEM": number(post.views), TIM: number(post.likes), "BÌNH LUẬN": number(post.comments),
  "LƯỢT LƯU": number(post.saves), "CHIA SẺ": number(post.shares),
}));
export const summaryColumns = ["Stt", "ĐỐI TÁC", "TỔNG LINK", "TỔNG LƯỢT XEM", "TỔNG TIM", "TỔNG BÌNH LUẬN", "TỔNG LƯỢT LƯU", "TỔNG CHIA SẺ", "Cập nhật lần cuối"];
const metrics = { "TỔNG LƯỢT XEM": "views", "TỔNG TIM": "likes", "TỔNG BÌNH LUẬN": "comments", "TỔNG LƯỢT LƯU": "saves", "TỔNG CHIA SẺ": "shares" };
export const summaryRows = partnerNames.map((partner) => {
  const selected = posts.filter((post) => post.partner === partner);
  return { "ĐỐI TÁC": partner, "TỔNG LINK": selected.length,
    ...Object.fromEntries(Object.entries(metrics).map(([column, key]) => [column, selected.reduce((sum, post) => sum + post[key], 0)])),
    "Cập nhật lần cuối": selected.map((post) => post.updated).sort().at(-1),
  };
}).sort((a, b) => b["TỔNG LƯỢT XEM"] - a["TỔNG LƯỢT XEM"]).map((row, index) => ({ Stt: index + 1, ...row }));
export const totals = Object.fromEntries(Object.keys(metrics).map((key) => [key, summaryRows.reduce((sum, row) => sum + row[key], 0)]));

export const photos = [
  { file: "valley.jpg", author: "Jeremy Brady", page: "https://unsplash.com/photos/misty-valley-viewed-through-pine-trees-cvvWOR85mf4", url: "https://images.unsplash.com/photo-1774081639594-0c4ab58afabb?auto=format&fit=crop&w=900&q=88" },
  { file: "lake.jpg", author: "Điệp Zader", page: "https://unsplash.com/photos/lush-green-forest-meets-tranquil-lake-water-i29Z07meKds", url: "https://images.unsplash.com/photo-1741524427564-0173c980c432?auto=format&fit=crop&w=900&q=88" },
  { file: "sunrise.jpg", author: "Tron Le", page: "https://unsplash.com/photos/a-foggy-mountain-with-trees-on-top-of-it-c4sOFGdTlt8", url: "https://images.unsplash.com/photo-1652829792625-055eb9e877a3?auto=format&fit=crop&w=900&q=88" },
].map((photo) => ({ ...photo, license: "Unsplash License", licenseUrl: "https://unsplash.com/license" }));
export const devices = [
  ["Nội dung 01", "iPhone 13", "ios", 93, "Sớm trên đồi", "valley.jpg"],
  ["Nội dung 02", "Pixel 7", "android", 86, "Một chiều bên hồ", "lake.jpg"],
  ["Review 01", "iPhone 12", "ios", 78, "Thành phố trong mây", "sunrise.jpg"],
  ["Review 02", "Galaxy S23", "android", 91, "Rừng thông tháng tám", "valley.jpg"],
  ["Kiểm thử iOS", "iPhone 14", "ios", 82, "Hẹn nhau ở Đà Lạt", "lake.jpg"],
  ["Kiểm thử Android", "Pixel 8", "android", 96, "Đón bình minh mới", "sunrise.jpg"],
].map(([name, model, platform, battery, title, photo], index) => ({
  udid: `DEMO-DALAT-${String(index + 1).padStart(2, "0")}`, name, model, platform, battery, title, photo,
  osVersion: platform === "ios" ? "18.6" : "15", connection: "mock", status: "ready", wdaReady: platform === "ios", tileStreamState: "live",
}));
const id = (value) => `00000000-0000-0000-0000-${String(value).padStart(12, "0")}`;
const node = (value, kind, x, y, config = {}, postcondition = null) => ({ id: id(value), kind, position: { x, y }, config, postcondition });
const edge = (value, from, to, sourcePort = "flow") => ({ id: id(value), sourceNodeId: id(from), targetNodeId: id(to), sourcePort, targetPort: "flow" });
export function createFlow(templatePngBase64 = "fixture-template-png") {
  return {
    schemaVersion: 2, id: id(100), name: "Kiểm tra giao diện", revision: 3, entryNodeId: id(101), viewport: { x: 0, y: 0, zoom: 0.8 },
    nodes: [
      node(101, "start", 0, 160),
      node(102, "launchApp", 230, 160, { bundleId: "com.riviu.demo" }, { kind: "activeAppEquals", bundleId: "com.riviu.demo" }),
      node(103, "ifVision", 460, 160, { templatePngBase64, threshold: 0.9 }),
      node(104, "screenshot", 700, 30, { label: "Trang chủ đã sẵn sàng", format: "jpeg" }, { kind: "artifactDecodedAndHashed" }),
      node(105, "wait", 700, 310, { durationMs: 1500 }),
      node(106, "screenshot", 930, 310, { label: "Kiểm tra trạng thái tải", format: "jpeg" }, { kind: "artifactDecodedAndHashed" }),
      node(107, "end", 1160, 160),
    ],
    edges: [edge(201, 101, 102), edge(202, 102, 103), edge(203, 103, 104, "matched"), edge(204, 103, 105, "notMatched"), edge(205, 105, 106), edge(206, 104, 107), edge(207, 106, 107)],
  };
}

export function validateFixtures() {
  assert.equal(posts.length, 24);
  assert.equal(new Set(posts.map((post) => post.id)).size, posts.length);
  assert.equal(new Set(posts.map((post) => post.link)).size, posts.length);
  for (const post of posts) {
    assert.equal(new URL(post.link).hostname, "demo.example");
    for (const key of ["views", "likes", "comments", "saves", "shares"]) assert.ok(Number.isInteger(post[key]) && post[key] > 0);
    assert.ok(post.likes < post.views && post.comments < post.likes && post.saves < post.likes);
  }
  for (const summary of summaryRows) {
    const selected = posts.filter((post) => post.partner === summary["ĐỐI TÁC"]);
    assert.equal(summary["TỔNG LINK"], selected.length);
    for (const [column, key] of Object.entries(metrics)) assert.equal(summary[column], selected.reduce((sum, post) => sum + post[key], 0));
  }
  assert.equal(devices.length, 6);
  assert.equal(new Set(devices.map((device) => device.name)).size, 6);
  assert.equal(devices.filter((device) => device.platform === "ios").length, 3);
  assert.ok(devices.every((device) => photos.some((photo) => photo.file === device.photo)));
  const flow = createFlow();
  const nodeIds = new Set(flow.nodes.map((node) => node.id));
  assert.ok(flow.edges.every((edge) => nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId)));
  assert.deepEqual(flow.edges.filter((edge) => edge.sourceNodeId === id(103)).map((edge) => edge.sourcePort).sort(), ["matched", "notMatched"]);
  const reached = new Set([flow.entryNodeId]);
  for (let pass = 0; pass < flow.nodes.length; pass += 1) for (const edge of flow.edges) if (reached.has(edge.sourceNodeId)) reached.add(edge.targetNodeId);
  assert.equal(reached.size, flow.nodes.length);
  return { devices: 6, platforms: { ios: 3, android: 3 }, flowNodes: flow.nodes.length, flowEdges: flow.edges.length, flowBranches: 2, posts: posts.length, partners: summaryRows.length, views: totals["TỔNG LƯỢT XEM"], aggregateChecks: "all 5 metrics reconcile with source posts", uniqueLinks: true };
}
