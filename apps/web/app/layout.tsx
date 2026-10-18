import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const siteUrl = new URL("https://cattfan.site");
const description =
  "Software Engineer ở Đà Lạt với 2 năm kinh nghiệm làm web và ứng dụng desktop, từ giao diện đến server. Dự án, công nghệ và thông tin liên hệ.";

const geistSans = localFont({
  src: "./fonts/Geist-Regular.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const newsreader = localFont({
  src: [
    {
      path: "./fonts/Newsreader-Regular.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "./fonts/Newsreader-Italic.woff2",
      style: "italic",
      weight: "400",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
  // Section headings below the book use it; keep it off the critical path.
  preload: false,
});

const bookSerif = localFont({
  src: [
    {
      path: "./fonts/SourceSerif4-Regular.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "./fonts/SourceSerif4-Italic.woff2",
      style: "italic",
      weight: "400",
    },
  ],
  variable: "--font-book",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  alternates: { canonical: "/" },
  title: "Đỗ Hiền Dinh | Software Engineer",
  description,
  authors: [{ name: "Đỗ Hiền Dinh", url: siteUrl }],
  openGraph: {
    title: "Đỗ Hiền Dinh | Software Engineer",
    description,
    siteName: "Đỗ Hiền Dinh",
    locale: "vi_VN",
    alternateLocale: "en_US",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Đỗ Hiền Dinh | Software Engineer",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#ece7dc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${newsreader.variable} ${bookSerif.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
