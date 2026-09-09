import type { Metadata, Viewport } from "next";
import { Amiri_Quran, Inter, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic"],
  display: "swap",
});

const amiriQuran = Amiri_Quran({
  variable: "--font-amiri",
  weight: "400",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Quran Root Research",
    template: "%s · Quran Root Research",
  },
  description:
    "A free, open-source, offline-capable tool for researching Qur'anic Arabic roots and word forms: every derivative, every occurrence, with the Uthmani text and translation.",
  manifest: "/manifest.webmanifest",
  applicationName: "Quran Root Research",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quran Roots",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7faf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d0c" },
  ],
};

// Runs before paint to avoid a light/dark flash: applies the user's stored
// preference, falling back to the system preference when nothing is stored.
const NO_FLASH_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'dark') document.documentElement.classList.add('dark');
    else if (stored === 'light') document.documentElement.classList.add('light');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoNaskhArabic.variable} ${amiriQuran.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
