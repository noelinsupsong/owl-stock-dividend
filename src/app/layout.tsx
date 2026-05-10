import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import "./globals.css";

const SITE_NAME = "Owl Stock Dividend";
const SITE_DESC =
  "KOSPI · KOSDAQ 상장 기업의 배당 입금일과 배당락일을 한눈에 확인할 수 있는 웹 서비스";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://owl-stock-dividend.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | KOSPI · KOSDAQ 배당 일정`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "배당",
    "배당금",
    "배당락일",
    "배당기준일",
    "KOSPI",
    "KOSDAQ",
    "배당 캘린더",
    "주식",
    "한국주식",
  ],
  authors: [{ name: SITE_NAME }],
  icons: {
    icon: "/owl.svg",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | KOSPI · KOSDAQ 배당 일정`,
    description: SITE_DESC,
    locale: "ko_KR",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} | KOSPI · KOSDAQ 배당 일정`,
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <div className="flex-1">{children}</div>
        <Footer />
        {adsenseClient && (
          <Script
            id="google-adsense"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          />
        )}
      </body>
    </html>
  );
}
