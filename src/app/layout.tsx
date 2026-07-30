import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/layout/navbar";
import AmbientBackground from "@/components/effects/ambient-background";
import DiscordWidget from "@/components/effects/discord-widget";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TFLives — Gaming Network",
  description:
    "La red de servidores Minecraft más innovadora. SurvivalRPG, Skyblock, Gens Tycoon y más.",
};

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

          {/* Discord Widget */}
          <DiscordWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}