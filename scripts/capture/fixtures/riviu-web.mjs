import assert from "node:assert/strict";

export const services = [
  {
    icon: "film",
    title: "Một bộ ảnh, trọn câu chuyện quán",
    description:
      "Từ ly cà phê đầu ngày đến góc ngồi nhiều nắng. Bộ nội dung dành cho menu mới, ngày khai trương và những mùa đặc biệt.",
    bullets:
      "20 ảnh món & không gian\n3 video dọc 30 giây\nBàn giao theo lịch đã duyệt",
    image: "/photos/coffee.jpg",
    imageAlt: "Ly cà phê trong bộ nội dung giới thiệu quán",
  },
  {
    icon: "megaphone",
    title: "Đưa quán đến đúng thực khách",
    description:
      "Lên ý tưởng, chọn kênh và sắp lịch đăng cho một chiến dịch F&B. Mỗi bài viết có thông điệp rõ và báo cáo sau khi đăng.",
    bullets:
      "Brief & lịch nội dung 4 tuần\nReview, check-in và video\nBáo cáo theo từng bài đăng",
    image: "/photos/restaurant.jpg",
    imageAlt: "Không gian nhà hàng trong chiến dịch truyền thông mẫu",
  },
  {
    icon: "storefront",
    title: "Giữ nhịp nội dung mỗi tuần",
    description:
      "Chăm chút hình ảnh và giọng viết xuyên suốt fanpage. Cân bằng câu chuyện món ăn, con người và những dịp hẹn tại quán.",
    bullets:
      "12 bài viết mỗi tháng\n4 chủ đề nội dung\nDuyệt nội dung trước khi đăng",
    image: "/photos/dessert.jpg",
    imageAlt: "Món tráng miệng cho lịch nội dung hàng tuần",
  },
  {
    icon: "community",
    title: "Một điểm hẹn, nhiều trải nghiệm",
    description:
      "Kết nối quán với người sáng tạo phù hợp. Theo sát từ khảo sát địa điểm, buổi trải nghiệm đến nội dung bàn giao.",
    bullets:
      "Chọn creator theo chủ đề\nLịch trải nghiệm tại quán\nTổng kết nội dung & phản hồi",
    image: "/photos/grill.jpg",
    imageAlt: "Bữa ăn trong buổi trải nghiệm ẩm thực mẫu",
  },
];

const faqs = [
  {
    question: "Quán mới khai trương nên bắt đầu từ đâu?",
    answer:
      "Bắt đầu bằng bộ ảnh món chủ lực, thông tin địa điểm và lịch nội dung hai tuần đầu. Sau đó chọn kênh đăng phù hợp với nhóm khách của quán.",
  },
  {
    question: "Quán sẽ duyệt những nội dung nào?",
    answer:
      "Ý tưởng, lịch chụp, bản thảo bài viết và video đều được gửi duyệt trước khi đăng. Tên món, mức giá và chương trình tại quán được kiểm tra trong từng bản thảo.",
  },
  {
    question: "Báo cáo sau chiến dịch gồm những gì?",
    answer:
      "Danh sách bài đăng, ngày đăng, kênh đăng, lượt xem và tương tác được tổng hợp theo từng nội dung. Phần ghi chú nêu những chủ đề đáng tiếp tục thử ở chiến dịch sau.",
  },
];

export const homeData = {
  root: { props: { seoTitle: "Riviu Đà Lạt | Nội dung thương hiệu F&B" } },
  content: [
    {
      type: "Hero",
      props: {
        id: "demo-hero",
        kicker: "Riviu Đà Lạt · Truyền thông F&B",
        titleLine: "Ăn khắp nơi,",
        titleAccent: "chơi khắp chốn.",
        description:
          "Kể câu chuyện của quán bằng hình ảnh, video và những trải nghiệm đáng nhớ. Từ bộ ảnh menu đến chiến dịch ra mắt, mỗi nội dung đều có kế hoạch rõ ràng.",
        primaryCta: "Trao đổi dự án",
        secondaryCta: "Khám phá các gói",
      },
    },
    {
      type: "Marquee",
      props: {
        id: "demo-topics",
        topics: [
          "Cà phê",
          "Nhà hàng",
          "Tiệm bánh",
          "Bữa sáng",
          "Lẩu & nướng",
          "Ẩm thực địa phương",
        ].map((label) => ({ label })),
        places: [
          "Đà Lạt",
          "Lâm Đồng",
          "Khai trương",
          "Menu mới",
          "Mùa lễ hội",
          "Cuối tuần",
        ].map((label) => ({ label })),
      },
    },
    {
      type: "Services",
      props: {
        id: "demo-services",
        layout: "stack",
        paddingY: "compact",
        kicker: "Dịch vụ Riviu",
        title: "Từ câu chuyện quán đến nội dung",
        sub: "Chụp ảnh, sản xuất video và triển khai truyền thông theo từng mục tiêu.",
        contactEmail: "hello@example.com",
        items: services,
      },
    },
    { type: "Process", props: { id: "demo-process" } },
    {
      type: "Faq",
      props: {
        id: "demo-faq",
        kicker: "Trước khi bắt đầu",
        title: "Cùng làm rõ kế hoạch",
        sub: "Những thông tin cần thống nhất trước mỗi dự án.",
        items: faqs,
      },
    },
    {
      type: "Contact",
      props: { id: "demo-contact", email: "hello@example.com" },
    },
  ],
};

export function validateRiviuWebFixture() {
  assert.equal(services.length, 4);
  assert.equal(
    new Set(homeData.content.map((block) => block.props.id)).size,
    homeData.content.length,
  );
  for (const service of services) {
    assert.equal(service.bullets.split("\n").length, 3);
    assert.ok(service.description.length > 90);
    assert.ok(service.image.startsWith("/photos/"));
    assert.ok(service.imageAlt.length > 20);
  }
  assert.equal(faqs.length, 3);
  return "RIVIU_WEB_FIXTURES_PASS: 6 CMS blocks; 4 services with photos; 3 complete FAQs.";
}
