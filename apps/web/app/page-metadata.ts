import type { Metadata } from "next";

const indexable = process.env.PORTFOLIO_INDEXABLE === "1";

const copy = {
  vi: {
    path: "/",
    locale: "vi_VN",
    alternateLocale: "en_US",
    title: "Đỗ Hiền Dinh | Freelance Software Engineer",
    description:
      "Freelance Software Engineer ở Đà Lạt với 2 năm kinh nghiệm làm web và ứng dụng desktop, từ giao diện đến server. Dự án, công nghệ và thông tin liên hệ.",
  },
  en: {
    path: "/en",
    locale: "en_US",
    alternateLocale: "vi_VN",
    title: "Đỗ Hiền Dinh | Freelance Software Engineer",
    description:
      "Freelance Software Engineer in Da Lat, Vietnam, with two years of experience building web and desktop apps, from interface to server. Projects, tech stack and contact details.",
  },
} as const;

// Each language page owns its metadata; robots live here so the 404 page keeps
// only Next's own noindex tag.
export function pageMetadata(language: keyof typeof copy): Metadata {
  const page = copy[language];
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: page.path,
      languages: { vi: "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      title: page.title,
      description: page.description,
      siteName: "Đỗ Hiền Dinh",
      locale: page.locale,
      alternateLocale: page.alternateLocale,
      type: "website",
      url: page.path,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
  };
}

// Structured data for search engines: who the site is about and how to reach them.
export function personJsonLd(language: keyof typeof copy) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Đỗ Hiền Dinh",
    jobTitle: "Freelance Software Engineer",
    url: new URL(copy[language].path, "https://cattfan.site").href,
    email: "mailto:dohiendinh.work@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Đà Lạt",
      addressCountry: "VN",
    },
    sameAs: ["https://github.com/cattfan"],
  });
}
