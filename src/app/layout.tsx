import type { Metadata, Viewport } from "next";
import { SITE_ORIGIN, absoluteUrl } from "@/lib/site";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

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

// Self-hosted rather than next/font/google's Amiri_Quran: this file is that
// exact font (Arabic subset) with one fix -- U+065E ARABIC FATHA WITH TWO
// DOTS, the tanwin mark on words like شَرَابٞ, is genuinely missing from
// upstream's binary (1,803 occurrences across the corpus render as a
// visible tofu box otherwise). See scripts/patch-amiri-quran-font.py for
// how the patch works and how to regenerate this file.
const amiriQuran = localFont({
  src: "./fonts/amiri-quran-patched.woff2",
  variable: "--font-amiri",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  // Set so Open Graph and Twitter image paths resolve absolutely. Canonical
  // URLs are NOT resolved against it -- Next uses the URL constructor, which
  // drops the /Holy-Qur-an base path from any path starting with "/", so
  // every page builds its own with absoluteUrl(). See src/lib/site.ts.
  metadataBase: new URL(`${SITE_ORIGIN}/`),
  alternates: { canonical: absoluteUrl("/") },
  title: {
    default: "Quran Root Research",
    template: "%s · Quran Root Research",
  },
  description:
    "A free, open-source, offline-capable tool for researching Qur'anic Arabic roots and word forms: every derivative, every occurrence, with the Uthmani text and translation.",
  // metadata.manifest is not auto-prefixed by Next's basePath (unlike the
  // icon.svg/apple-icon.png convention routes), so it's done explicitly here.
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
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
// (The Arabic UI toggle deliberately does *not* get the same treatment here
// -- see LanguageContext.tsx's comment on why a pre-hydration language
// switch is a page-wide hydration-mismatch risk that a one-class theme
// switch isn't, and why a brief flash is accepted instead.)
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
        <LanguageProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <InstallPrompt />
          <ServiceWorkerRegister />
        </LanguageProvider>
      </body>
    </html>
  );
}
