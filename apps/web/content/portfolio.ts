export const portfolio = {
  name: "Đỗ Hiền Dinh",
  title: "Freelance Software Engineer",
  experienceYears: 2,
  email: "dohiendinh.work@gmail.com",
  phone: "+84 964 173 913",
  phoneHref: "+84964173913",
  github: "https://github.com/cattfan",
  source: "https://github.com/cattfan/MyPortfolio",
  introduction:
    "Mình là Software Engineer làm freelance với 2 năm kinh nghiệm, nhận trọn từ giao diện, API, cơ sở dữ liệu đến triển khai server. Hai sản phẩm bên dưới là dự án freelance mình làm cho Riviu, từ đầu đến cuối: một ứng dụng desktop điều khiển nhiều điện thoại cùng lúc và một website thương hiệu đang chạy thật.",
  approach:
    "Trước khi code, mình làm rõ bài toán và hỏi lại những chỗ chưa chắc. Làm xong, mình tự dùng thử, viết kiểm thử cho các luồng quan trọng và sửa những chỗ còn bất tiện.",
} as const;

export const journeyChapters = [
  {
    id: "viet-nam",
    title: "Lập trình từ sự tò mò.",
    description:
      "Mình thích hiểu cách mọi thứ vận hành. Hai năm qua, sự tò mò đó thành những sản phẩm thật: website, ứng dụng desktop và hệ thống chạy trên server.",
    label: "Giới thiệu",
    place: "Việt Nam",
  },
  {
    id: "phia-nam",
    title: "Hiểu vấn đề trước khi viết code.",
    description:
      "Mình bắt đầu bằng việc lắng nghe, đặt câu hỏi và làm rõ điều cần giải quyết. Giải pháp tốt là giải pháp người dùng thấy dễ dùng.",
    label: "Cách mình làm việc",
    place: "Phía Nam",
  },
  {
    id: "cao-nguyen",
    title: "Học bằng cách làm.",
    description:
      "Rust cho ứng dụng desktop, NestJS cho API, Docker để triển khai. Mỗi dự án, mình học thêm một công cụ và dùng nó cho việc thật.",
    label: "Học hỏi",
    place: "Cao nguyên Lâm Viên",
  },
  {
    id: "da-lat",
    title: "Sẵn sàng cho dự án tiếp theo.",
    description:
      "Mình nhận dự án freelance về web và ứng dụng desktop: trao đổi rõ phạm vi từ đầu, làm từ giao diện đến server và cải thiện qua từng phiên bản.",
    label: "Hợp tác",
    place: "Đà Lạt",
  },
] as const;

export const projects = [
  {
    id: "riviu-manager",
    name: "Riviu Manager",
    category: "Quản lý đa thiết bị di động",
    platform: "Phần mềm",
    liveUrl: null,
    screenshotSource: "demo",
    description:
      "Phần mềm quản lý đa thiết bị di động Android và iOS trên máy tính, hỗ trợ theo dõi màn hình, điều khiển và tự động hóa thao tác.",
    role: "Freelance cho Riviu · phát triển toàn bộ sản phẩm",
    technologies: ["Tauri 2", "Rust", "React", "TypeScript", "React Flow"],
    challenge:
      "Quản lý nhiều điện thoại cùng lúc, theo dõi kết nối và thực hiện các thao tác lặp lại mà không phải xử lý từng máy riêng lẻ.",
    contribution:
      "Xây ứng dụng bằng Tauri, Rust và React; tích hợp kết nối thiết bị, xem màn hình, điều khiển và quản lý theo nhóm. Phát triển trình tạo kịch bản Flow kéo thả cùng các công cụ kiểm tra trạng thái thiết bị.",
    engineering:
      "Tách phần kết nối Android và iOS khỏi giao diện React, dùng Rust để xử lý thiết bị và chạy kịch bản. Trình Flow giữ phần tạo luồng thao tác trực quan; bộ cài đóng gói các thành phần cần thiết để giảm bước thiết lập trên máy người dùng.",
    outcome:
      "Từ danh sách thiết bị, người dùng mở màn hình, điều khiển điện thoại và chạy cùng một luồng thao tác trên nhiều máy thay vì làm tay từng máy.",
    screenshots: [
      {
        src: "/projects/riviu-manager/overview.webp?v=20261027-1",
        card: "/projects/riviu-manager/overview-card.webp",
        alt: "Riviu Manager hiển thị màn hình và trạng thái kết nối của nhiều thiết bị di động",
        width: 1920,
        height: 1200,
      },
      {
        src: "/projects/riviu-manager/detail.webp?v=20261027-1",
        card: "/projects/riviu-manager/detail-card.webp",
        alt: "Trình biên tập Flow với sơ đồ hành động và bảng cấu hình",
        width: 1920,
        height: 1200,
      },
    ],
  },
  {
    id: "riviu-web",
    name: "Riviu Web",
    category: "Website thương hiệu & dịch vụ",
    platform: "Web",
    liveUrl: "https://taskscatt.click/",
    screenshotSource: "live",
    description:
      "Website giới thiệu thương hiệu Riviu, dịch vụ truyền thông và bảng giá, tích hợp quản trị nội dung và tiếp nhận liên hệ.",
    role: "Freelance cho Riviu · phát triển toàn bộ sản phẩm",
    technologies: ["Next.js", "NestJS", "Prisma", "PostgreSQL", "Puck"],
    challenge:
      "Trình bày dịch vụ và bảng giá rõ ràng cho khách hàng, đồng thời giúp đội ngũ cập nhật nội dung và theo dõi website.",
    contribution:
      "Xây giao diện Next.js, API NestJS và cơ sở dữ liệu PostgreSQL. Phát triển trình chỉnh sửa nội dung Puck, bảng giá, biểu mẫu liên hệ và dashboard thống kê truy cập; triển khai website lên server.",
    engineering:
      "Tách frontend Next.js và API NestJS để quản lý nội dung, liên hệ và thống kê. Nội dung được lưu trong PostgreSQL qua Prisma; trang quản trị dùng Puck để chỉnh sửa và xuất bản các section mà không phải sửa trực tiếp mã giao diện.",
    outcome:
      "Website mình triển khai cho Riviu đang hoạt động tại taskscatt.click, với các trang dịch vụ dành cho khách hàng và hệ thống quản trị cho đội ngũ vận hành.",
    screenshots: [
      {
        src: "/projects/riviu-web/live-overview.webp",
        card: "/projects/riviu-web/live-overview-card.webp",
        alt: "Trang chủ Riviu giới thiệu thương hiệu và dịch vụ truyền thông",
        width: 2880,
        height: 1800,
      },
      {
        src: "/projects/riviu-web/live-detail.webp",
        card: "/projects/riviu-web/live-detail-card.webp",
        alt: "Bảng so sánh các gói dịch vụ trên website Riviu đang hoạt động",
        width: 2880,
        height: 1800,
      },
    ],
  },
] as const;

export const techStack = [
  {
    id: "frontend",
    label: "Frontend",
    description: "Giao diện web và tương tác.",
    technologies: ["TypeScript", "React", "Next.js", "Tailwind CSS"],
  },
  {
    id: "backend",
    label: "Backend",
    description: "API và xử lý nghiệp vụ.",
    technologies: ["Node.js", "NestJS", "REST API"],
  },
  {
    id: "data",
    label: "Cơ sở dữ liệu",
    description: "Lưu trữ, truy vấn và mô hình dữ liệu.",
    technologies: ["PostgreSQL", "SQL", "Prisma"],
  },
  {
    id: "desktop",
    label: "Ứng dụng desktop",
    description: "Phần mềm trên máy tính và kết nối thiết bị.",
    technologies: ["Rust", "Tauri", "React Flow"],
  },
  {
    id: "deployment",
    label: "Triển khai",
    description: "Đóng gói và chạy ứng dụng trên server.",
    technologies: ["Docker", "Nginx", "Linux"],
  },
  {
    id: "workflow",
    label: "Quy trình & kiểm thử",
    description: "Quản lý mã nguồn và kiểm tra luồng sử dụng.",
    technologies: ["Git", "GitHub", "Playwright"],
  },
] as const;

export const experience = [
  {
    id: "delivery",
    title: "Không chỉ viết cho chạy",
    description:
      "Mình muốn hiểu vì sao code chạy được và khi nào nó sẽ hỏng. Gặp lỗi thì tìm đến nguyên nhân gốc, rồi thêm kiểm thử để lỗi đó không quay lại.",
  },
  {
    id: "communication",
    title: "Trao đổi bằng ví dụ cụ thể",
    description:
      "Một màn hình, một thao tác hay một lỗi tái hiện được thường giúp mọi người hiểu nhau nhanh hơn một đoạn mô tả dài.",
  },
  {
    id: "shipping",
    title: "Làm đến khi chạy thật",
    description:
      "Từ đóng gói ứng dụng desktop đến Docker, Nginx và HTTPS, mình đưa sản phẩm tới tay người dùng chứ không dừng ở bản demo.",
  },
] as const;

export type Project = {
  id: string;
  name: string;
  category: string;
  platform: string;
  liveUrl: string | null;
  screenshotSource: string;
  description: string;
  role: string;
  technologies: readonly string[];
  challenge: string;
  contribution: string;
  engineering: string;
  outcome: string;
  screenshots: readonly {
    src: string;
    card: string;
    alt: string;
    width: number;
    height: number;
  }[];
};
