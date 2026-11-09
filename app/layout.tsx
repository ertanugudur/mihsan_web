import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/lib/site";
import Loader from "@/components/Loader";

const poppins = localFont({
  src: [
    { path: "../public/fonts/Poppins-Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/Poppins-Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/Poppins-Medium.otf", weight: "500", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

// Cinea Sans demo sürümünde Türkçe karakter yok: yalnızca ASCII metinlerde kullanılır.
const cinea = localFont({
  src: [
    { path: "../public/fonts/CineaSans-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/CineaSans-Medium.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-cinea",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "Koli ve Karton Kutu İmalatı | Mihsan Ambalaj",
  applicationName: "Mihsan Ambalaj",
  keywords: [
    "koli imalatı",
    "karton kutu imalatı",
    "koli üreticisi",
    "özel ölçü koli",
    "baskılı koli",
    "logolu koli",
    "karton köşebent",
    "palet köşebent",
    "ondüle karton üreticisi",
    "ondüle karton toptan",
    "oluklu mukavva kutu",
    "çift oluklu koli",
    "koli fiyat teklifi",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  ...(site.googleVerification ? { verification: { google: site.googleVerification } } : {}),
  description: site.description,
  openGraph: {
    title: "Koli ve Karton Kutu İmalatı | Mihsan Ambalaj",
    description: site.description,
    locale: "tr_TR",
    url: "/",
    siteName: "Mihsan Ambalaj",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Koli ve Karton Kutu İmalatı | Mihsan Ambalaj",
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${poppins.variable} ${cinea.variable}`}>
      <body>
        <Loader />
        {children}
      </body>
    </html>
  );
}
