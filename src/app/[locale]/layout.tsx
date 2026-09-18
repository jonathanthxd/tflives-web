import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Chakra_Petch, Fredoka, Inter, JetBrains_Mono, Nunito, Outfit, Pixelify_Sans, Quicksand, Rubik, Space_Grotesk, VT323 } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/providers/theme-provider";
import { StudioProvider } from "@/providers/studio-provider";
import Navbar from "@/shared/ui/layout/navbar";
import Footer from "@/shared/ui/layout/footer";
import CookieNotice from "@/shared/ui/cookie-notice";
import ScrollReset from "@/shared/ui/layout/scroll-reset";
import AmbientBackground from "@/shared/ui/effects/ambient-background";
import DiscordWidget from "@/shared/ui/effects/discord-widget";
import OAuthErrorNotice from "@/shared/ui/oauth-error-notice";
import { SkipLink } from "@/shared/ui/skip-link";
import { siteMetadata } from "@/config/site";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800"],
});
const vt323 = VT323({
  subsets: ["latin"],
  variable: "--font-vt323",
  weight: "400",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
});
const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["400", "500", "600", "700"],
});

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixelify",
  weight: ["400", "500", "600", "700"],
});
const chakra = Chakra_Petch({
  subsets: ["latin"],
  variable: "--font-chakra",
  weight: ["400", "500", "600", "700"],
});
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["400", "500", "600", "700"],
});
const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = siteMetadata;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${nunito.variable} ${vt323.variable} ${outfit.variable} ${fredoka.variable} ${pixelify.variable} ${chakra.variable} ${quicksand.variable} ${rubik.variable} ${GeistSans.variable} font-sans antialiased min-h-screen relative`}
      >
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <StudioProvider>
              <AmbientBackground />

              <ScrollReset />
              <SkipLink />
              <Suspense fallback={null}>
                <Navbar />
              </Suspense>
              <OAuthErrorNotice />
              <div id="page-content" tabIndex={-1}>{children}</div>
              <Footer />
              <CookieNotice />

              {/* Discord Widget */}
              <DiscordWidget />
            </StudioProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
