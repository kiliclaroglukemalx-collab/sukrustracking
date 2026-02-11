"use client";

import { useMemo } from "react";
import { TopBar } from "@/components/top-bar";
import { KasaCard } from "@/components/kasa-card";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { useStore } from "@/lib/store";

function computeGrid(count: number): { cols: number; rows: number } {
  if (count <= 0) return { cols: 1, rows: 1 };
  const candidates: { cols: number; rows: number; waste: number }[] = [];
  for (let c = 4; c <= 10; c++) {
    const r = Math.ceil(count / c);
    const waste = c * r - count;
    candidates.push({ cols: c, rows: r, waste });
  }
  candidates.sort((a, b) => {
    if (a.waste !== b.waste) return a.waste - b.waste;
    return Math.abs(a.cols - a.rows) - Math.abs(b.cols - b.rows);
  });
  return candidates[0];
}

const colsClass: Record<number, string> = {
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
};

export default function Page() {
  const { kasaData, videoUrl } = useStore();
  const grid = useMemo(() => computeGrid(kasaData.length), [kasaData.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Hamburger menu */}
      <HamburgerMenu />

      {/* White top section - fixed height header */}
      <div className="relative z-10 flex-shrink-0 bg-white px-5">
        <TopBar data={kasaData} />
      </div>

      {/* Gradient transition: white to OLED black */}
      <div
        className="relative z-10 h-6 flex-shrink-0"
        style={{
          background: "linear-gradient(to bottom, #ffffff 0%, #000000 100%)",
        }}
      />

      {/* OLED Black grid section with scoped video */}
      <div
        className="relative z-10 flex flex-1 flex-col overflow-hidden"
        style={{ background: "#000000" }}
      >
        {/* Video background - scoped to dark section only */}
        {videoUrl && (
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            <video
              className="h-full w-full object-cover opacity-[0.06] blur-[2px]"
              autoPlay
              muted
              loop
              playsInline
              key={videoUrl}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.88)" }}
            />
          </div>
        )}

        {/* Card grid */}
        <div
          className={`relative z-10 grid flex-1 ${colsClass[grid.cols] || "grid-cols-7"} gap-2.5 p-2.5 pt-1`}
          style={{
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
          }}
        >
          {kasaData.map((card, i) => (
            <KasaCard key={card.id} data={card} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
