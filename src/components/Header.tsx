"use client";

import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import Link from "next/link";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav
      className="fixed w-full shadow-sm z-50"
      style={{ backgroundColor: "white" }}
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="text-2xl logo-text w-1/4">
            PlanVia
          </Link>

          {/* Desktop Menu - Centered */}
          <div className="hidden md:flex justify-center space-x-6 w-2/4">
            <Link href="/#features" className="nav-link text-sm">
              Özellikler
            </Link>
            <Link href="/#solutions" className="nav-link text-sm">
              Çözümler
            </Link>
            <Link href="/#pricing" className="nav-link text-sm">
              Fiyatlandırma
            </Link>
            <Link href="/#contact" className="nav-link text-sm">
              İletişim
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center justify-end space-x-3 w-1/4">
            <Link
              href="/login"
              className="text-gray-700 hover:text-violet-600 font-medium text-sm px-3 py-1.5"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="bg-violet-600 text-white px-6 py-1.5 rounded-full font-medium hover:bg-violet-800 transition-all duration-300 text-sm"
            >
              İşletme Kaydı
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-3">
            <div className="flex flex-col space-y-3">
              <Link href="/#features" className="nav-link text-sm">
                Özellikler
              </Link>
              <Link href="/#solutions" className="nav-link text-sm">
                Çözümler
              </Link>
              <Link href="/#pricing" className="nav-link text-sm">
                Fiyatlandırma
              </Link>
              <Link href="/#contact" className="nav-link text-sm">
                İletişim
              </Link>
              <div className="pt-3 border-t border-gray-100">
                <Link
                  href="/login"
                  className="block w-full text-left py-1.5 text-gray-700 hover:text-violet-600 font-medium text-sm"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="block w-full mt-2 bg-violet-600 text-white px-6 py-1.5 rounded-full font-medium hover:bg-violet-800 transition-all duration-300 text-sm"
                >
                  İşletme Kaydı
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
