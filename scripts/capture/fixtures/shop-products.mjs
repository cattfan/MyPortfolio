import assert from "node:assert/strict";

export const exchangeRate = 25000;
export const productsFixture = [
  {
    id: "studio-ui-kit",
    name: "Studio UI Kit",
    category: "Thiết kế",
    kind: "dashboard",
    label: "Figma design system",
    color: "#416f66",
    background: "#dcece5",
    description:
      "48 màn hình dashboard, hơn 240 component và bộ token cho Figma.",
    details:
      "Bộ giao diện quản trị cho sản phẩm SaaS, cửa hàng và công cụ vận hành. Các màn hình dùng Auto Layout và component variants để chỉnh sửa đồng bộ.",
    contents: [
      "48 màn hình desktop và mobile trong file Figma",
      "240 component: bảng, biểu đồ, form và điều hướng",
      "Design token, hướng dẫn sử dụng và 6 luồng mẫu",
    ],
    prices: [250000, 600000, 1200000],
    stock: [42, 18, 8],
    sales: [128, 34, 12],
  },
  {
    id: "focus-planner",
    name: "Focus Planner 2026",
    category: "Năng suất",
    kind: "planner",
    label: "Notion workspace",
    color: "#546d96",
    background: "#e1e9f4",
    description:
      "Lịch tuần, mục tiêu quý và bảng theo dõi thói quen trong Notion.",
    details:
      "Một workspace gọn để lập kế hoạch và theo dõi việc đang làm. Gồm ví dụ cho dự án cá nhân, học tập và công việc nhóm.",
    contents: [
      "12 mẫu tuần và 4 trang mục tiêu quý",
      "Theo dõi 8 thói quen, ghi chú và đánh giá cuối tuần",
      "Template Notion và hướng dẫn thiết lập",
    ],
    prices: [100000, 250000, 450000],
    stock: [76, 28, 12],
    sales: [216, 58, 19],
  },
  {
    id: "mono-icons",
    name: "Mono Essential Icons",
    category: "Thiết kế",
    kind: "icons",
    label: "SVG + Figma library",
    color: "#79608f",
    background: "#ece3f3",
    description: "320 icon nét mảnh theo lưới 24px, có SVG và thư viện Figma.",
    details:
      "Bộ icon thống nhất cho website và ứng dụng: điều hướng, tài khoản, tệp, thanh toán và công việc. Mỗi biểu tượng được tổ chức theo nhóm chức năng.",
    contents: [
      "320 icon SVG, stroke 1.75px trên lưới 24px",
      "320 component Figma đổi màu bằng token",
      "Danh mục tìm kiếm và bộ ví dụ sử dụng",
    ],
    prices: [150000, 350000, 700000],
    stock: [53, 16, 7],
    sales: [184, 42, 15],
  },
  {
    id: "saas-starter",
    name: "SaaS Starter Kit",
    category: "Lập trình",
    kind: "code",
    label: "Next.js project template",
    color: "#437a81",
    background: "#deeced",
    description:
      "Khung Next.js với auth, dashboard, phân quyền và trang cài đặt.",
    details:
      "Mã nguồn khởi tạo cho ứng dụng SaaS với cấu trúc tính năng rõ ràng. Bao gồm luồng tài khoản, trang tổng quan và ví dụ API cho dữ liệu demo.",
    contents: [
      "Next.js App Router, TypeScript và Tailwind CSS",
      "Auth, role-based routes, dashboard và 8 trang cài đặt",
      "Seed demo, test mẫu và hướng dẫn triển khai Docker",
    ],
    prices: [400000, 900000, 1800000],
    stock: [21, 9, 4],
    sales: [67, 23, 8],
  },
  {
    id: "palette-system",
    name: "Palette System",
    category: "Thiết kế",
    kind: "palette",
    label: "Color tokens for interfaces",
    color: "#9b666a",
    background: "#f2e2e0",
    description: "12 bảng màu giao diện với token sáng/tối và cặp màu dễ đọc.",
    details:
      "Thư viện màu có cấu trúc cho hệ thống thiết kế. Các thang màu và cặp chữ/nền đi kèm ví dụ giao diện để chọn theo ngữ cảnh.",
    contents: [
      "12 thang màu, mỗi thang 10 mức sắc độ",
      "Token JSON, CSS variables và Figma variables",
      "24 cặp chữ/nền kèm tỷ lệ tương phản",
    ],
    prices: [75000, 200000, 400000],
    stock: [84, 31, 13],
    sales: [152, 37, 11],
  },
  {
    id: "portfolio-templates",
    name: "Portfolio Templates",
    category: "Lập trình",
    kind: "portfolio",
    label: "React website collection",
    color: "#647753",
    background: "#e7eddc",
    description:
      "4 mẫu portfolio React cho lập trình viên và người làm sáng tạo.",
    details:
      "Bốn bộ bố cục độc lập với trang dự án, giới thiệu và liên hệ. Nội dung được tách khỏi component để cập nhật mà không sửa giao diện.",
    contents: [
      "4 mẫu responsive dùng React và TypeScript",
      "Trang chủ, case study, kinh nghiệm và liên hệ",
      "Bộ dữ liệu mẫu, SEO metadata và hướng dẫn deploy",
    ],
    prices: [200000, 500000, 1000000],
    stock: [36, 14, 5],
    sales: [98, 26, 9],
  },
  {
    id: "content-calendar",
    name: "Content Calendar",
    category: "Năng suất",
    kind: "calendar",
    label: "Content planning workspace",
    color: "#a47835",
    background: "#f1ebd8",
    description: "Lịch nội dung 90 ngày, brief bài viết và checklist xuất bản.",
    details:
      "Không gian theo dõi nội dung từ ý tưởng đến ngày đăng. Gồm lịch tháng, bảng trạng thái và thư viện brief để phối hợp giữa người viết và thiết kế.",
    contents: [
      "Lịch 90 ngày, 3 bảng trạng thái và 12 mẫu brief",
      "Theo dõi kênh, người phụ trách và hạn duyệt",
      "Template Notion và bản Google Sheets",
    ],
    prices: [125000, 300000, 600000],
    stock: [62, 24, 9],
    sales: [143, 45, 14],
  },
  {
    id: "freelance-finance",
    name: "Freelance Finance",
    category: "Năng suất",
    kind: "finance",
    label: "Invoice + budget templates",
    color: "#54728a",
    background: "#e0e9f0",
    description: "Mẫu báo giá, hóa đơn và bảng thu chi dành cho freelancer.",
    details:
      "Bộ bảng tính theo dõi hợp đồng, khoản phải thu và chi phí dự án. Có dữ liệu ví dụ và công thức sẵn để bắt đầu theo tháng.",
    contents: [
      "6 mẫu báo giá và hóa đơn có thể đổi nhận diện",
      "Dashboard thu chi, lịch thanh toán và theo dõi hợp đồng",
      "Tệp Excel, Google Sheets và bản PDF chỉnh sửa",
    ],
    prices: [125000, 275000, 550000],
    stock: [48, 17, 6],
    sales: [121, 32, 10],
  },
];

export function buildProducts(api, artworks = []) {
  const licenseNames = ["Cá nhân", "Nhóm 5 người", "Thương mại"];
  return productsFixture.map((product, i) => {
    const variants = product.prices.map((price, index) => ({
      id: `demo-${product.id}-${index}`,
      name: licenseNames[index],
      price: price / exchangeRate,
      priceCurrency: "VND",
      priceAmount: price,
      sortOrder: index,
      active: true,
      availableStock: product.stock[index],
      sold: product.sales[index],
    }));
    return {
      id: `demo-${product.id}`,
      slug: i === 0 ? "demo-design-kit" : product.id,
      name: product.name,
      category: product.category,
      shortDescription: product.description,
      description: `${product.details}\n\nBộ sản phẩm gồm:\n${product.contents.map((line) => `- ${line}`).join("\n")}\n\nQuyền sử dụng:\n- Cá nhân: 1 người, 1 dự án\n- Nhóm 5 người: tối đa 5 thành viên, 5 dự án\n- Thương mại: tối đa 10 thành viên, dùng cho dự án khách hàng; không bán lại tệp gốc\n\nDanh mục và số liệu trong phiên bản này là dữ liệu demo.`,
      currency: "USDT",
      minPrice: Math.min(...variants.map((v) => v.price)),
      maxPrice: Math.max(...variants.map((v) => v.price)),
      image: `${api}/images/${i}.png`,
      thumbnail: `${api}/images/${i}.png`,
      imageBytes: artworks[i]?.length ?? 0,
      thumbnailBytes: artworks[i]?.length ?? 0,
      images: [],
      sortOrder: i,
      active: true,
      stockDrawMode: "SEQUENTIAL",
      availableStock: variants.reduce(
        (total, v) => total + v.availableStock,
        0,
      ),
      sold: variants.reduce((total, v) => total + v.sold, 0),
      createdAt: `2026-08-${String(3 + i * 3).padStart(2, "0")}T09:00:00Z`,
      variants,
    };
  });
}

export function validateProducts(products) {
  assert.equal(products.length, 8);
  assert.equal(new Set(products.map((product) => product.slug)).size, 8);
  const categories = new Set();
  for (const product of products) {
    categories.add(product.category);
    assert.equal(product.variants.length, 3);
    assert.ok(product.description.includes("dữ liệu demo"));
    assert.equal(
      product.availableStock,
      product.variants.reduce(
        (sum, variant) => sum + variant.availableStock,
        0,
      ),
    );
    assert.equal(
      product.sold,
      product.variants.reduce((sum, variant) => sum + variant.sold, 0),
    );
    assert.equal(
      product.minPrice,
      Math.min(...product.variants.map((variant) => variant.price)),
    );
    assert.equal(
      product.maxPrice,
      Math.max(...product.variants.map((variant) => variant.price)),
    );
    for (const variant of product.variants) {
      assert.ok(
        Number.isInteger(variant.priceAmount) && variant.priceAmount > 0,
      );
      assert.ok(
        Math.abs(variant.price * exchangeRate - variant.priceAmount) < 0.001,
      );
      assert.equal(
        Math.ceil(variant.price * exchangeRate),
        variant.priceAmount,
      );
      assert.ok(
        Number.isInteger(variant.availableStock) && variant.availableStock >= 0,
      );
      assert.ok(Number.isInteger(variant.sold) && variant.sold >= 0);
    }
  }
  assert.equal(categories.size, 3);
  return {
    products: products.length,
    variants: products.reduce((n, p) => n + p.variants.length, 0),
    stock: products.reduce((n, p) => n + p.availableStock, 0),
    sold: products.reduce((n, p) => n + p.sold, 0),
  };
}

const rows = (values) =>
  values
    .map(
      ([name, label, value]) =>
        `<div class="table-row"><span>${name}</span><small>${label}</small><b>${value}</b></div>`,
    )
    .join("");

export function productArtwork(product, icon) {
  const dashboard = `<div class="app"><aside><b>Studio</b><span class="active">${icon("LayoutDashboard")} Overview</span><span>${icon("ChartNoAxesCombined")} Analytics</span><span>${icon("Users")} Customers</span><span>${icon("FolderOpen")} Projects</span><span>${icon("Settings")} Settings</span><footer>Workspace<br><b>Design team</b></footer></aside><main><div class="topline">Workspace overview <i>September 2026</i></div><h2>Good morning, Linh</h2><div class="metrics"><section><small>Revenue</small><h3>$24,860</h3><em>+12.8% this month</em></section><section><small>Active projects</small><h3>18</h3><em>4 ready for review</em></section><section><small>New customers</small><h3>284</h3><em>+32 this week</em></section></div><div class="split"><section class="chart"><b>Revenue overview</b><div class="bars">${[35, 52, 43, 61, 54, 73, 65, 86, 78, 96, 84, 110].map((h) => `<span style="height:${h}px"></span>`).join("")}</div><small>Jan &nbsp; Feb &nbsp; Mar &nbsp; Apr &nbsp; May &nbsp; Jun</small></section><section class="activity"><b>Project activity</b><p><i class="dot"></i> Website redesign<small>Ready for review</small></p><p><i class="dot orange"></i> Mobile onboarding<small>In progress</small></p><p><i class="dot blue"></i> Brand guidelines<small>Updated 2 hours ago</small></p></section></div><section class="table"><b>Recent projects</b>${rows(
    [
      ["Studio website", "Design", "$4,200"],
      ["Customer portal", "Development", "$8,640"],
      ["Mobile app", "Review", "$6,180"],
    ],
  )}</section></main></div>`;
  const planner = `<div class="planner"><div class="planner-top"><span>Focus / Personal workspace</span><span>${icon("Sun")} Monday, 07 September</span></div><h1>A little more focus.</h1><p>Your week, with room to breathe.</p><div class="planner-grid"><section><h3>This week's priorities</h3>${["Finish portfolio case study", "Ship the client dashboard", "Make time for learning"].map((t, i) => `<div class="task">${icon(i === 0 ? "SquareCheck" : "Square")}<span>${t}</span></div>`).join("")}<h3 class="space">Daily rhythm</h3><div class="habits"><span>Read 20 minutes</span><b>● ● ● ● ○ ○ ○</b><span>Move your body</span><b>● ● ○ ● ○ ○ ○</b><span>Write one thing</span><b>● ● ● ○ ○ ○ ○</b></div></section><section><h3>Today, intentionally</h3><div class="agenda"><time>09:00</time><span>Deep work<small>Portfolio project</small></span><time>11:30</time><span>Design review<small>Studio team</small></span><time>14:00</time><span>Build & test<small>Client dashboard</small></span><time>16:30</time><span>Weekly reflection<small>Notes and next steps</small></span></div><div class="note">One thing at a time.<br><small>Progress is a practice.</small></div></section></div></div>`;
  const icons = `<div class="icon-sheet"><div class="sheet-title"><div><h1>Mono Essential</h1><p>Clear shapes. Consistent rhythm.</p></div><b>320 icons<br><small>24 px / 1.75 stroke</small></b></div><div class="icon-grid">${["House", "Search", "Bell", "Settings", "User", "Users", "Mail", "MessageCircle", "Calendar", "Clock", "Folder", "FileText", "Image", "Camera", "Video", "Music", "Heart", "Star", "Bookmark", "Link", "Download", "Upload", "Share2", "Copy", "ShoppingBag", "CreditCard", "Wallet", "Receipt", "ChartNoAxesCombined", "PieChart", "BarChart3", "LayoutDashboard", "Shield", "Lock", "KeyRound", "CircleCheck", "Globe", "MapPin", "Compass", "Navigation"].map((name) => `<div>${icon(name)}</div>`).join("")}</div><footer>Navigation &nbsp; / &nbsp; Communication &nbsp; / &nbsp; Commerce &nbsp; / &nbsp; Files</footer></div>`;
  const code = `<div class="code-window"><div class="window-bar">${icon("Code2")} SaaS Starter / Workspace <span>TypeScript</span></div><div class="code-body"><aside><b>Explorer</b><p>▾ apps</p><p class="indent">▾ web</p><p class="indent2">▾ app</p><p class="indent3">dashboard</p><p class="indent3">settings</p><p class="indent3">auth</p><p class="indent2">components</p><p class="indent2">lib</p><p>▾ packages</p><p class="indent">ui</p><p class="indent">config</p><p>package.json</p></aside><main><div class="code-tab">page.tsx</div><pre><span class="violet">import</span> { Dashboard } <span class="violet">from</span> <span class="green">"@/features/dashboard"</span>;
<span class="violet">import</span> { getSession } <span class="violet">from</span> <span class="green">"@/lib/auth"</span>;

<span class="muted">// Your product starts here.</span>
<span class="violet">export default async function</span> <span class="yellow">Page</span>() {
  <span class="violet">const</span> session = <span class="violet">await</span> <span class="yellow">getSession</span>();

  <span class="violet">return</span> (
    &lt;<span class="green">Dashboard</span>
      workspace={session.workspace}
      role={session.user.role}
    /&gt;
  );
}</pre><div class="terminal"><small>Terminal</small><p><span class="green">✓</span> Type check passed</p><p><span class="green">✓</span> 24 tests passed</p><p><span class="green">✓</span> Ready on localhost:3000</p></div></main></div></div>`;
  const colors = [
    ["Fern", "#e7f2eb", "#b8d9c4", "#7cb391", "#428360", "#235439"],
    ["Iris", "#efebf8", "#d4c9ec", "#ad98d2", "#8162b1", "#503978"],
    ["Lake", "#e4f0f5", "#bbdbe6", "#83b9ce", "#4c8daa", "#2a5975"],
    ["Clay", "#f9e9e5", "#ecc6bc", "#d79a8b", "#b86856", "#854336"],
  ];
  const palette = `<div class="palette"><h1>Color, with a system.</h1><p>Scales, semantics and accessible pairs.</p>${colors.map(([name, ...swatches]) => `<div class="swatch-row"><b>${name}</b>${swatches.map((color, index) => `<div style="background:${color};color:${index < 3 ? "#333" : "#fff"}"><span>${100 + index * 200}</span><small>${color}</small></div>`).join("")}</div>`).join("")}<div class="token-row"><div><small>Semantic token</small><code>--color-action-primary</code></div><div class="token-demo">Create project</div><span>AA / 5.8:1</span></div></div>`;
  const portfolio = `<div class="portfolio-preview"><nav><b>Alex Morgan</b><span>Work &nbsp; About &nbsp; Contact</span></nav><div class="portfolio-title"><small>Independent designer & developer</small><h1>Making thoughtful<br>things for the web.</h1><p>Selected work, experiments, and everything in between.</p></div><div class="portfolio-work"><section><div class="poster"><h2>form &<br>function.</h2><span>Brand identity / 2026</span></div><p>Studio Forma <small>Brand & digital</small></p></section><section><div class="screen-mini"><div class="mini-sidebar"></div><div class="mini-content"><h4>Good morning.</h4><div class="mini-blocks"><span></span><span></span><span></span></div><div class="mini-chart">${[30, 55, 38, 70, 61, 90].map((h) => `<i style="height:${h}px"></i>`).join("")}</div></div></div><p>Clarity Workspace <small>Product design</small></p></section></div></div>`;
  const events = {
    2: ["Studio story", "blue"],
    4: ["UI tips", "green"],
    7: ["Case study", "pink"],
    9: ["New release", "orange"],
    11: ["Behind scenes", "blue"],
    14: ["Weekly notes", "green"],
    16: ["Icon showcase", "pink"],
    18: ["Build log", "blue"],
    21: ["Team picks", "green"],
    23: ["Product tour", "orange"],
    25: ["October plan", "pink"],
  };
  const calendar = `<div class="calendar"><div class="calendar-head"><div><small>Content workspace</small><h1>September 2026</h1></div><b>Month &nbsp; / &nbsp; Board</b></div><div class="calendar-days">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => `<b>${day}</b>`).join("")}${Array.from(
    { length: 35 },
    (_, i) => {
      const day = i;
      const event = events[day];
      return `<div><small>${day > 0 && day <= 30 ? day : ""}</small>${event ? `<span class="event ${event[1]}">${event[0]}</span>` : ""}</div>`;
    },
  ).join(
    "",
  )}</div><footer><span class="event green">Ready to publish</span><span class="event blue">In production</span><span class="event pink">In review</span></footer></div>`;
  const finance = `<div class="finance"><header><b>Freelance Finance</b><span>September 2026</span></header><h1>A clear view of your work.</h1><div class="finance-grid"><section><small>Income this month</small><h2>$8,450<span>+18.4%</span></h2><div class="bars">${[54, 42, 68, 56, 85, 71, 95, 110].map((h) => `<span style="height:${h}px"></span>`).join("")}</div><div class="financial-summary"><span>Expenses <b>$1,280</b></span><span>Net income <b>$7,170</b></span></div><div class="table"><b>Recent invoices</b>${rows(
    [
      ["INV-024", "Studio website", "$2,400"],
      ["INV-025", "Design system", "$3,250"],
      ["INV-026", "App prototype", "$2,800"],
    ],
  )}</div></section><section class="invoice"><div class="invoice-top">Invoice <span>#INV-026</span></div><h2>Alex Morgan</h2><p>Design & development</p><hr><small>Billed to</small><h3>Clarity Studio</h3><div class="invoice-lines"><span>App prototype</span><b>$2,400</b><span>Design handoff</span><b>$400</b></div><div class="invoice-total"><small>Total due</small><strong>$2,800</strong></div><p class="invoice-note">Due September 30, 2026<br>Thank you for working together.</p></section></div></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${artworkStyles}</style></head><body style="--accent:${product.color};--canvas:${product.background}"><div class="art-title"><strong>${product.name}</strong><span>${product.label}</span></div><div class="canvas">${{ dashboard, planner, icons, code, palette, portfolio, calendar, finance }[product.kind]}</div><div class="art-footer"><span>ShopOfCatt / Digital collection</span><span>Demo preview</span></div></body></html>`;
}

const artworkStyles = `
*{box-sizing:border-box}body{margin:0;width:960px;height:720px;padding:36px;background:var(--canvas);color:#262d2d;font:15px/1.45 'Segoe UI',Arial,sans-serif;letter-spacing:0}h1,h2,h3,h4,p{margin:0}svg{width:20px;height:20px;stroke-width:1.75}.art-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.art-title strong{font-size:26px}.art-title span{font-size:14px;color:var(--accent)}.canvas{height:552px;background:white;border:1px solid #25342a17;border-radius:8px;overflow:hidden;box-shadow:0 12px 30px #24332918}.art-footer{display:flex;justify-content:space-between;margin-top:20px;font-size:12px;color:#506056}.app{height:100%;display:flex}.app aside{width:156px;flex-shrink:0;background:#f4f7f5;padding:24px 15px;position:relative}.app aside>b{font-size:24px;color:var(--accent);display:block;margin:0 10px 28px}.app aside>span{font-size:12px;display:flex;align-items:center;gap:8px;padding:10px 9px;color:#718278}.app aside>span svg{width:16px;height:16px}.app aside>.active{background:#e3ede7;color:#3b6558;border-radius:5px}.app aside footer{position:absolute;bottom:24px;font-size:11px;left:24px;color:#87968d}.app main{padding:25px 26px;flex:1;min-width:0}.topline{font-size:11px;color:#8d9692;display:flex;justify-content:space-between}.topline i{font-style:normal}.app h2{font-size:22px;margin:9px 0 20px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.metrics section{border:1px solid #e7ebe8;border-radius:5px;padding:13px}.metrics small{font-size:10px;color:#838e86}.metrics h3{font-size:24px;margin:4px 0}.metrics em{font-size:9px;color:#648b73;font-style:normal}.split{display:grid;grid-template-columns:1.2fr 1fr;gap:14px;margin-top:15px}.split section{border:1px solid #e7ebe8;border-radius:5px;padding:13px}.split b,.table>b{font-size:11px}.bars{height:128px;display:flex;align-items:flex-end;gap:9px;border-bottom:1px solid #e3e8e3;margin:8px 0}.bars span{flex:1;background:var(--accent);border-radius:3px 3px 0 0;opacity:.75}.bars span:nth-child(even){opacity:.38}.chart>small{font-size:8px;color:#92a196}.activity p{font-size:10px;margin-top:19px}.activity p small{display:block;color:#8c968e;font-size:9px;padding-left:14px}.dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#64a084;margin-right:8px}.dot.orange{background:#d9a369}.dot.blue{background:#739bba}.table{margin-top:17px}.table-row{display:flex;justify-content:space-between;border-bottom:1px solid #ecf0ed;padding:9px 0;font-size:10px}.table-row span{width:47%}.table-row small{color:#99a59d;width:28%}.table-row b{font-weight:500;flex:1;text-align:right}.planner{padding:26px 32px;background:#fdfdfc;height:100%}.planner-top{display:flex;justify-content:space-between;font-size:10px;color:#8793a1}.planner-top span{display:flex;align-items:center;gap:6px}.planner-top svg{width:15px}.planner h1{font:40px/1.1 Georgia,serif;margin-top:26px}.planner>p{font-size:12px;color:#8e989f;margin-top:10px}.planner-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:35px;margin-top:28px}.planner-grid h3{font-size:13px;border-bottom:1px solid #e8edf0;padding-bottom:9px;margin-bottom:11px}.task{display:flex;align-items:center;gap:9px;font-size:12px;padding:11px 0}.task svg{color:var(--accent);width:16px}.space{margin-top:28px}.habits{display:grid;grid-template-columns:1fr auto;gap:13px 7px;font-size:10px}.habits b{font-weight:400;color:#8092ae}.agenda{display:grid;grid-template-columns:45px 1fr;gap:19px;font-size:12px}.agenda time{color:#9aa5b0;font-size:10px}.agenda small{display:block;font-size:10px;color:#98a2ac}.note{margin-top:26px;background:#edf1f7;padding:15px 18px;font:italic 20px Georgia,serif}.note small{font:10px 'Segoe UI';color:#8894a5}.icon-sheet{padding:30px}.sheet-title{display:flex;justify-content:space-between}.sheet-title h1{font-size:28px}.sheet-title p{margin-top:8px;color:#96909c;font-size:12px}.sheet-title>b{font-size:13px;text-align:right;color:var(--accent)}.sheet-title small{font-size:10px;font-weight:400}.icon-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:15px;margin-top:28px}.icon-grid>div{height:65px;border:1px solid #e9e5ee;border-radius:7px;display:grid;place-items:center}.icon-grid svg{height:27px;width:27px;color:#615367}.icon-sheet footer{font-size:10px;color:#a099a6;margin-top:26px}.code-window{height:100%;background:#202b33;color:#cbd8de}.window-bar{height:48px;background:#283640;display:flex;align-items:center;gap:9px;padding:0 23px;font-size:12px}.window-bar span{margin-left:auto;color:#91aaae;font-size:10px}.code-body{display:flex;height:calc(100% - 48px)}.code-body aside{width:168px;background:#25323c;font-size:11px;padding:19px;color:#9fadb7}.code-body aside b{font-weight:500;color:#d3dee4}.code-body aside p{margin-top:12px}.indent{padding-left:9px}.indent2{padding-left:18px}.indent3{padding-left:28px}.code-body main{flex:1;min-width:0}.code-tab{width:120px;background:#202b33;padding:12px 21px;border-top:2px solid #88babc;font-size:12px}.code-body pre{font:12px/1.7 Consolas,monospace;padding:14px 20px;margin:0}.violet{color:#c4a3de}.green{color:#9dceb5}.yellow{color:#e6cf9d}.muted{color:#6f8995}.terminal{border-top:1px solid #38464e;margin-top:7px;padding:14px 20px;font:11px/1.9 Consolas,monospace}.terminal>small{color:#75909c;font-size:10px;display:block;margin-bottom:6px}.palette{padding:30px}.palette h1{font-size:29px}.palette>p{font-size:12px;color:#969097;margin:7px 0 25px}.swatch-row{display:grid;grid-template-columns:65px repeat(5,1fr);margin-bottom:13px;align-items:center}.swatch-row>b{font-size:12px}.swatch-row>div{height:70px;padding:10px;display:flex;flex-direction:column;justify-content:space-between;font-size:11px}.swatch-row small{font-size:9px}.token-row{border-top:1px solid #ebe4e3;display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding-top:14px;font-size:10px}.token-row small{display:block;color:#948884}.token-row code{font-size:11px}.token-demo{background:#428360;color:white;padding:10px 18px;border-radius:4px}.portfolio-preview{padding:25px 32px}.portfolio-preview nav{display:flex;justify-content:space-between;font-size:10px}.portfolio-preview nav b{font-size:14px}.portfolio-title{padding:27px 0}.portfolio-title small{font-size:10px;color:#788976}.portfolio-title h1{font:34px/1.05 Georgia,serif;margin:10px 0}.portfolio-title p{font-size:10px;color:#8d9889}.portfolio-work{display:grid;grid-template-columns:1fr 1fr;gap:20px}.poster{height:218px;background:#cdd7c3;padding:26px;display:flex;flex-direction:column;justify-content:space-between}.poster h2{font-size:44px;line-height:.95;color:#3e5337}.poster>span{font-size:8px;color:#69805c}.portfolio-work p{font-size:11px;margin-top:10px}.portfolio-work small{font-size:9px;color:#899480;float:right}.screen-mini{height:218px;display:flex;background:#f3f5f6;padding:16px}.mini-sidebar{width:36px;background:#e0e6ec}.mini-content{padding:12px;flex:1;background:white;min-width:0}.mini-content h4{font-size:12px}.mini-blocks{display:flex;gap:5px;margin-top:14px}.mini-blocks span{height:33px;background:#edf2f5;flex:1}.mini-chart{display:flex;align-items:end;gap:10px;height:104px}.mini-chart i{background:#87a6b2;width:16px}.calendar{padding:28px}.calendar-head{display:flex;align-items:center;justify-content:space-between}.calendar-head small{font-size:10px;color:#aa956c}.calendar h1{font-size:27px;margin-top:6px}.calendar-head>b{font-size:11px;color:#8b8d86;font-weight:500}.calendar-days{display:grid;grid-template-columns:repeat(7,1fr);margin-top:23px}.calendar-days>b{font-size:11px;padding:9px 5px;background:#f7f7f1;color:#8a8b7e;font-weight:500}.calendar-days>div{height:89px;border:1px solid #eeeee7;border-right:0;border-bottom:0;padding:6px}.calendar-days>div:nth-child(7n){border-right:1px solid #eeeee7}.calendar-days>div small{font-size:10px;color:#929687}.event{display:block;margin-top:10px;padding:6px 5px;font-size:9px;border-radius:3px;line-height:1.25;background:#e2e9f5;color:#5e789e}.event.green{background:#e5eddf;color:#6d8959}.event.pink{background:#f0e5eb;color:#a5718e}.event.orange{background:#f6ecdc;color:#b28b4e}.calendar footer{display:flex;gap:16px;margin-top:12px}.calendar footer .event{margin:0;padding:4px 8px}.finance{padding:26px 30px}.finance header{display:flex;justify-content:space-between;font-size:10px;color:#8899a3}.finance header b{color:#4d6472;font-size:13px}.finance>h1{font-size:27px;margin-top:18px}.finance-grid{display:grid;grid-template-columns:1fr 270px;gap:30px;margin-top:22px}.finance-grid>section>small{font-size:11px;color:#8d9ba4}.finance-grid h2{font-size:28px;margin-top:6px}.finance-grid h2 span{font-size:10px;color:#6c9a80;margin-left:18px}.finance .bars{height:126px;gap:15px}.financial-summary{display:flex;justify-content:space-between;font-size:10px;color:#8e9da7;margin:15px 0}.financial-summary b{display:block;color:#3c5361;font-size:15px;margin-top:4px}.finance .table-row{padding:14px 0}.invoice{padding:24px 20px;border:1px solid #e6ebee;background:#fbfcfd;box-shadow:0 5px 14px #4561760a}.invoice-top{font:24px Georgia,serif;color:#426476;display:flex;align-items:center;justify-content:space-between}.invoice-top span{font:9px 'Segoe UI';color:#a3b1b8}.invoice h2{font-size:15px;margin-top:28px}.invoice>p{font-size:9px;color:#91a1ad}.invoice hr{border:0;border-top:1px solid #e6edf0;margin:21px 0}.invoice>small{font-size:8px;color:#9babb4}.invoice h3{font-size:12px;margin-top:5px}.invoice-lines{display:grid;grid-template-columns:1fr auto;gap:15px;font-size:9px;margin-top:26px}.invoice-lines b{font-weight:500}.invoice-total{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #dce6ec;margin-top:23px;padding-top:14px}.invoice-total small{font-size:9px;color:#8296a3}.invoice-total strong{font-size:23px;color:#3b647b}.invoice .invoice-note{font-size:8px;margin-top:31px;line-height:1.8}
  .app .table{margin-top:10px}.app .table-row{padding:6px 0}.app .split{margin-top:10px}.app .chart .bars{height:112px}.app .activity p{margin-top:15px}.calendar-days>div{height:70px}.calendar-days .event{margin-top:7px;padding:4px;font-size:8px}.finance .invoice{padding-bottom:14px}
`;
