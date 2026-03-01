"use client";

import Image from "next/image";

export function LogoBgEffect() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
      aria-hidden
    >
      <div className="relative animate-logo-spin opacity-[0.12]">
        <div
          className="absolute inset-0 -m-24 rounded-full"
          style={{
            boxShadow:
              "0 0 80px 40px rgba(59, 130, 246, 0.15), 0 0 120px 60px rgba(245, 158, 11, 0.08)",
          }}
        />
        <Image
          src="/logo.png"
          alt=""
          width={320}
          height={320}
          className="relative z-10 rounded-full object-contain"
        />
      </div>
    </div>
  );
}
