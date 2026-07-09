import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import Navbar from "@/components/layout/navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TFLives — Gaming Network",
  description: "La red de servidores Minecraft más innovadora. SurvivalRPG, Skyblock, Gens Tycoon y más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${GeistSans.variable} font-sans antialiased bg-tfl-night text-tfl-bone min-h-screen`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}