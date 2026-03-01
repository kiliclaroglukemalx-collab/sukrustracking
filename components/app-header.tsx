"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  Trophy,
  FileText,
  Gift,
  Users,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { HamburgerMenu } from "./hamburger-menu";

const SCROLL_THRESHOLD = 60;

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, title: "Ana Sayfa" },
];

const REPORT_ITEMS = [
  { href: "/raporlar/performans", icon: Trophy, title: "Dis Finans Cekim Performansi" },
  { href: "/raporlar/cekim", icon: FileText, title: "Cekim Performans Raporu" },
  { href: "/raporlar/analiz", icon: BarChart2, title: "Gunun Finansal Analizi" },
  { href: "/raporlar/bonus", icon: Gift, title: "Bonus Raporu" },
  { href: "/raporlar/yeni-oyuncular", icon: Users, title: "Yeni Oyuncular" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { role } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(typeof window !== "undefined" && window.scrollY > SCROLL_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (role === "basic") {
    return (
      <header className="sticky top-0 z-40 w-full">
        <div className="mx-4 mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/95 px-4 py-2.5 backdrop-blur-sm md:mx-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Sukrus"
              width={36}
              height={36}
              className="rounded-full object-contain"
            />
            <span className="text-sm font-semibold text-white">Sukrus</span>
          </Link>
          <HamburgerMenu embedded />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full">
      <div
        className={cn(
          "mx-4 mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/95 px-4 backdrop-blur-sm transition-all duration-300 md:mx-6",
          isScrolled ? "py-2" : "py-3"
        )}
      >
        {/* Logo - scroll ile toparlanir */}
        <Link href="/" className="flex items-center gap-2.5 transition-all duration-300">
          <Image
            src="/logo.png"
            alt="Sukrus"
            width={isScrolled ? 32 : 48}
            height={isScrolled ? 32 : 48}
            className="rounded-full object-contain transition-all duration-300"
          />
          <span
            className={cn(
              "font-semibold text-white transition-all duration-300",
              isScrolled ? "max-w-0 overflow-hidden opacity-0" : "max-w-[120px] opacity-100"
            )}
          >
            Sukrus
          </span>
        </Link>

        {/* Orta - Nav */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-white/15 font-medium text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">{item.title}</span>
              </Link>
            );
          })}

          {/* Raporlar dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setReportsOpen(!reportsOpen)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
                REPORT_ITEMS.some((r) => pathname === r.href)
                  ? "bg-white/15 font-medium text-white"
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <BarChart2 className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Raporlar</span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", reportsOpen && "rotate-180")}
                strokeWidth={1.5}
              />
            </button>
            {reportsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden
                  onClick={() => setReportsOpen(false)}
                />
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-neutral-900 py-1 shadow-xl">
                  {REPORT_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setReportsOpen(false)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                          isActive
                            ? "bg-white/15 font-medium text-white"
                            : "text-neutral-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.5} />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Sag - Hamburger */}
        <HamburgerMenu embedded />
      </div>
    </header>
  );
}
