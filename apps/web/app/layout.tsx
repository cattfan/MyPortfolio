import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const siteUrl = new URL("https://cattfan.site");
const description =
  "Freelance Software Engineer ở Đà Lạt với 2 năm kinh nghiệm làm web và ứng dụng desktop, từ giao diện đến server. Dự án, công nghệ và thông tin liên hệ.";

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

// Shared defaults; app/page-metadata.ts sets each language page's own metadata.
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Đỗ Hiền Dinh | Freelance Software Engineer",
  description,
  authors: [{ name: "Đỗ Hiền Dinh", url: siteUrl }],
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
    // The English page is exported with lang="en"; the client keeps it in sync.
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${newsreader.variable} ${bookSerif.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
