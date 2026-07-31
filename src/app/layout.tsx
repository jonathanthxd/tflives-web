import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/providers/theme-provider";
import Navbar from "@/shared/ui/layout/navbar";
import Footer from "@/shared/ui/layout/footer";
import AmbientBackground from "@/shared/ui/effects/ambient-background";
import DiscordWidget from "@/shared/ui/effects/discord-widget";
import { siteMetadata } from "@/config/site";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${GeistSans.variable} font-sans antialiased min-h-screen relative`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AmbientBackground />

          <Navbar />
          {children}
          <Footer />

          {/* Discord Widget */}
          <DiscordWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
