"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism mejorado con ligera sombra */}
      <div className="absolute inset-0 bg-tfl-night/70 backdrop-blur-xl border-b border-tfl-sky/10 shadow-lg shadow-black/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Theme toggle placeholder (sin cambios funcionales) */}
          <div className="hidden md:flex items-center w-32">
            <button className="p-2 rounded-lg text-tfl-stone hover:text-tfl-sky hover:bg-tfl-sky/5 transition-all duration-300">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
            </button>
          </div>

          {/* Center: Logo + Links */}
          <div className="flex items-center gap-8">
            {/* Enlace Tienda con subrayado animado */}
            <Link
              href="/tienda"
              className="relative text-sm font-medium text-tfl-stone hover:text-tfl-sky transition-colors duration-300 tracking-wide py-1 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-tfl-sky/70 after:transition-all after:duration-300 hover:after:w-full"
            >
              Tienda
            </Link>

            {/* Logo con resplandor al hover */}
            <Link href="/" className="flex flex-col items-center group">
              <span className="font-display text-2xl md:text-3xl font-bold tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(147,197,253,0.5)]">
                <span className="text-tfl-bone group-hover:text-tfl-sky transition-colors duration-300">
                  TFL
                </span>
                <span className="text-tfl-sky group-hover:text-tfl-pastel transition-colors duration-300">
                  ives
                </span>
              </span>
              {/* Línea expansible suavizada */}
              <span className="w-0 group-hover:w-full h-[1px] bg-gradient-to-r from-transparent via-tfl-sky/50 to-transparent transition-all duration-500 mt-0.5" />
            </Link>

            {/* Enlace TFL Network con subrayado animado */}
            <Link
              href="/network"
              className="relative text-sm font-medium text-tfl-stone hover:text-tfl-sky transition-colors duration-300 tracking-wide py-1 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-tfl-sky/70 after:transition-all after:duration-300 hover:after:w-full"
            >
              TFL Network
            </Link>
          </div>

          {/* Right: Login placeholder mejorado */}
          <div className="hidden md:flex items-center justify-end w-32">
            <button className="px-4 py-2 text-sm font-medium text-tfl-stone border border-tfl-stone/20 rounded-full hover:border-tfl-sky/50 hover:text-tfl-sky hover:bg-tfl-sky/5 transition-all duration-300 backdrop-blur-sm">
              Login
            </button>
          </div>

          {/* Mobile menu button con aria-expanded */}
          <button
            className="md:hidden p-2 text-tfl-stone hover:text-tfl-sky transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Abrir menú"
          >
            <svg
              className="w-6 h-6 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu animado con transición suave */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-tfl-night/95 backdrop-blur-xl border-b border-tfl-sky/10 shadow-inner">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/tienda"
              className="block py-2 text-tfl-stone hover:text-tfl-sky transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Tienda
            </Link>
            <Link
              href="/"
              className="block py-2 text-tfl-sky font-medium"
              onClick={() => setMobileOpen(false)}
            >
              TFLives
            </Link>
            <Link
              href="/network"
              className="block py-2 text-tfl-stone hover:text-tfl-sky transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              TFL Network
            </Link>
            <div className="pt-2 border-t border-tfl-sky/10">
              <button className="w-full py-2 text-sm font-medium text-tfl-stone border border-tfl-stone/20 rounded-full hover:border-tfl-sky/50 hover:text-tfl-sky transition-all duration-300">
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}