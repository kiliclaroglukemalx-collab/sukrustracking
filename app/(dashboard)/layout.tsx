"use client";

import { useStore } from "@/lib/store";
import { AppHeader } from "@/components/app-header";
import { LogoBgEffect } from "@/components/logo-bg-effect";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useStore();

  return (
    <div className="relative min-h-screen bg-black">
      <LogoBgEffect />
      {role === "basic" ? (
        <>
          <AppHeader />
          <main className="relative z-10 flex-1">{children}</main>
        </>
      ) : (
        <>
          <AppHeader />
          <main className="relative z-10 flex-1 overflow-auto">{children}</main>
        </>
      )}
    </div>
  );
}
