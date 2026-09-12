import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/providers/theme-provider";
import Navbar from "@/shared/ui/layout/navbar";
import Footer from "@/shared/ui/layout/footer";
import AmbientBackground from "@/shared/ui/effects/ambient-background";
import DiscordWidget from "@/shared/ui/effects/discord-widget";
import OAuthErrorNotice from "@/shared/ui/oauth-error-notice";
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${GeistSans.variable} font-sans antialiased min-h-screen relative`}
      >
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <AmbientBackground />

            <Navbar />
            <OAuthErrorNotice />
            {children}
            <Footer />

            {/* Discord Widget */}
            <DiscordWidget />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
