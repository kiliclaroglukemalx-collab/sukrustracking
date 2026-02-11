"use client";

import { useState, useCallback, useMemo } from "react";
import { TopBar } from "@/components/top-bar";
import { KasaCard } from "@/components/kasa-card";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { VideoBackground } from "@/components/video-background";
import { generateDemoData } from "@/lib/excel-processor";
import type { KasaCardData } from "@/lib/excel-processor";

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
  const [kasaData, setKasaData] = useState<KasaCardData[]>(() =>
    generateDemoData(),
  );
  const [videoUrl, setVideoUrl] = useState("");
  const [screenshotMode, setScreenshotMode] = useState(false);

  const handleDataLoaded = useCallback((data: KasaCardData[]) => {
    setKasaData(data);
  }, []);

  const handleReset = useCallback(() => {
    setKasaData(generateDemoData());
  }, []);

  const grid = useMemo(() => computeGrid(kasaData.length), [kasaData.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Video behind the dark section only */}
      <VideoBackground src={videoUrl} disabled={screenshotMode} />

      {/* Hamburger menu */}
      <HamburgerMenu
        onDataLoaded={handleDataLoaded}
        onReset={handleReset}
        onVideoChange={setVideoUrl}
        videoUrl={videoUrl}
        screenshotMode={screenshotMode}
        onScreenshotToggle={() => setScreenshotMode((p) => !p)}
      />

      {/* White top section */}
      <div
        className={`relative z-10 flex-shrink-0 bg-white ${
          screenshotMode ? "px-5 pt-3 pb-2" : "px-5 pt-3 pb-3"
        }`}
      >
        <TopBar data={kasaData} screenshotMode={screenshotMode} />
      </div>

      {/* Gradient transition: white -> black */}
      <div
        className="relative z-10 h-8 flex-shrink-0"
        style={{
          background: "linear-gradient(to bottom, #ffffff 0%, #000000 100%)",
        }}
      />

      {/* OLED Black grid section */}
      <div
        className="relative z-10 flex flex-1 flex-col overflow-hidden"
        style={{ background: "#000000" }}
      >
        {/* Grid */}
        <div
          className={`grid flex-1 ${colsClass[grid.cols] || "grid-cols-7"} ${
            screenshotMode ? "gap-2 p-2 pt-0" : "gap-3 p-3 pt-0"
          }`}
          style={{
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
          }}
        >
          {kasaData.map((card) => (
            <KasaCard
              key={card.id}
              data={card}
              screenshotMode={screenshotMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
