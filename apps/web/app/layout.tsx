import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "Đỗ Hiền Dinh | Software Engineer",
  description:
    "Đỗ Hiền Dinh, Software Engineer với 2 năm kinh nghiệm. Đôi điều về mình, những dự án đã làm và thông tin liên hệ.",
  openGraph: {
    title: "Đỗ Hiền Dinh | Software Engineer",
    description:
      "Đỗ Hiền Dinh, Software Engineer. Giới thiệu, dự án và liên hệ.",
    locale: "vi_VN",
    alternateLocale: "en_US",
    type: "website",
  },
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
