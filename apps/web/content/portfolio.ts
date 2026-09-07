export const portfolio = {
  name: "Đỗ Hiền Dinh",
  title: "Software Engineer",
  experienceYears: 2,
  email: "dohiendinh.work@gmail.com",
  phone: "+84 964 173 913",
  phoneHref: "+84964173913",
  location: "Đà Lạt, Việt Nam",
  introduction:
    "Mình là Đỗ Hiền Dinh, có 2 năm kinh nghiệm lập trình web và ứng dụng. Mình phát triển website, phần mềm quản lý thiết bị di động và công cụ tổng hợp dữ liệu, từ giao diện đến backend và triển khai.",
  approach:
    "Mình thích hiểu rõ việc cần làm trước khi bắt tay vào code. Chỗ nào chưa rõ thì hỏi lại; làm xong thì tự dùng thử, thấy bất tiện ở đâu thì sửa ở đó.",
} as const;

export const journeyChapters = [
  {
    id: "viet-nam",
    title: "Lập trình từ sự tò mò.",
    description:
      "Mình là Đỗ Hiền Dinh, Software Engineer với 2 năm kinh nghiệm. Mình thích tìm hiểu cách mọi thứ hoạt động và giải quyết vấn đề bằng phần mềm.",
    label: "Giới thiệu",
    place: "Việt Nam",
    kicker: "01 / Giới thiệu",
    skills: ["TypeScript", "React"],
  },
  {
    id: "phia-nam",
    title: "Hiểu vấn đề trước khi viết code.",
    description:
      "Mình bắt đầu bằng việc lắng nghe, đặt câu hỏi và làm rõ điều cần giải quyết. Với mình, giải pháp tốt cần phù hợp với người sử dụng.",
    label: "Cách mình làm việc",
    place: "Phía Nam",
    kicker: "02 / Cách mình làm việc",
    skills: ["Next.js", "Tailwind CSS"],
  },
  {
    id: "cao-nguyen",
    title: "Luôn có điều để học thêm.",
    description:
      "Mình học qua việc thử, kiểm tra và nhận phản hồi. Mỗi vấn đề mới là dịp để hiểu sâu hơn và cải thiện cách làm của mình.",
    label: "Học hỏi",
    place: "Cao nguyên Lâm Viên",
    kicker: "03 / Học hỏi",
    skills: ["Tauri", "REST API"],
  },
  {
    id: "da-lat",
    title: "Sẵn sàng cho dự án tiếp theo.",
    description:
      "Mình tìm cơ hội phát triển web và ứng dụng cùng một nhóm có trao đổi rõ ràng. Mình sẵn sàng nhận phản hồi, kiểm thử và cải thiện từng phiên bản.",
    label: "Hợp tác",
    place: "Đà Lạt",
    kicker: "04 / Hợp tác",
    skills: ["Git", "Testing"],
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
    role: "Phát triển toàn bộ sản phẩm",
    technologies: ["Tauri 2", "Rust", "React", "TypeScript", "React Flow"],
    challenge:
      "Quản lý nhiều điện thoại cùng lúc, theo dõi kết nối và thực hiện các thao tác lặp lại mà không phải xử lý từng máy riêng lẻ.",
    contribution:
      "Xây ứng dụng bằng Tauri, Rust và React; tích hợp kết nối thiết bị, xem màn hình, điều khiển và quản lý theo nhóm. Phát triển trình tạo kịch bản Flow kéo thả cùng các công cụ kiểm tra trạng thái thiết bị.",
    outcome:
      "Phần mềm tập trung việc quản lý điện thoại, điều khiển và chạy kịch bản thao tác trong cùng một giao diện.",
    screenshots: [
      {
        src: "/projects/riviu-manager/overview.webp?v=20260907-2",
        alt: "Riviu Manager hiển thị màn hình và trạng thái kết nối của nhiều thiết bị di động",
        caption: "Quản lý thiết bị",
        width: 1920,
        height: 1200,
      },
      {
        src: "/projects/riviu-manager/detail.webp?v=20260907-2",
        alt: "Trình biên tập Flow với sơ đồ hành động và bảng cấu hình",
        caption: "Trình biên tập Flow",
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
    role: "Phát triển toàn bộ sản phẩm",
    technologies: ["Next.js", "NestJS", "Prisma", "PostgreSQL", "Puck"],
    challenge:
      "Trình bày dịch vụ và bảng giá rõ ràng cho khách hàng, đồng thời giúp đội ngũ cập nhật nội dung và theo dõi website.",
    contribution:
      "Xây giao diện Next.js, API NestJS và cơ sở dữ liệu PostgreSQL. Phát triển trình chỉnh sửa nội dung Puck, bảng giá, biểu mẫu liên hệ và dashboard thống kê truy cập; triển khai website lên server.",
    outcome:
      "Website đang hoạt động tại taskscatt.click, với các trang dịch vụ dành cho khách hàng và hệ thống quản trị cho đội ngũ vận hành.",
    screenshots: [
      {
        src: "/projects/riviu-web/live-overview.webp",
        alt: "Trang chủ Riviu giới thiệu thương hiệu và dịch vụ truyền thông",
        caption: "Trang chủ Riviu",
        width: 2880,
        height: 1800,
      },
      {
        src: "/projects/riviu-web/live-detail.webp",
        alt: "Bảng so sánh các gói dịch vụ trên website Riviu đang hoạt động",
        caption: "Bảng giá dịch vụ",
        width: 2880,
        height: 1800,
      },
    ],
  },
] as const;

export const experience = [
  {
    id: "delivery",
    title: "Không chỉ viết cho chạy",
    description:
      "Mình muốn hiểu vì sao một đoạn code chạy được, và khi nào nó sẽ hỏng. Có lỗi thì tìm lại nguyên nhân, thay vì sửa tạm rồi bỏ qua.",
  },
  {
    id: "devices",
    title: "Có gì chưa rõ thì trao đổi",
    description:
      "Mình thích trao đổi bằng ví dụ cụ thể. Một màn hình, một thao tác hoặc một lỗi gặp phải thường giúp mọi người hiểu nhau nhanh hơn.",
  },
  {
    id: "operation",
    title: "Vẫn còn nhiều thứ để học",
    description:
      "Hai năm chưa phải là nhiều. Mình đang rèn cách đọc code, tìm lỗi và chọn giải pháp vừa đủ cho việc cần làm.",
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
  outcome: string;
  screenshots: readonly {
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
  }[];
};
