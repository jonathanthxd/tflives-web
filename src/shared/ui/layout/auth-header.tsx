"use client";

import Link from "next/link";

export default function AuthHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl border-b border-primary/10" />
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="font-display text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap">
          <span className="text-foreground">TFL</span>
          <span className="text-primary">ives</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </Link>
      </div>
    </header>
  );
}
