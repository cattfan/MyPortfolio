import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

const newsreader = localFont({
  src: [
    {
      path: "./fonts/Newsreader-Regular.ttf",
      style: "normal",
      weight: "200 800",
    },
    {
      path: "./fonts/Newsreader-Italic.ttf",
      style: "italic",
      weight: "200 800",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
});

const bookSerif = localFont({
  src: [
    {
      path: "./fonts/SourceSerif4-Regular.ttf",
      style: "normal",
      weight: "200 900",
    },
    {
      path: "./fonts/SourceSerif4-Italic.ttf",
      style: "italic",
      weight: "200 900",
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
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${bookSerif.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
