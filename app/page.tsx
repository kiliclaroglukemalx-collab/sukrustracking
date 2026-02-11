"use client";

import { useState, useCallback, useMemo } from "react";
import { KasaCard } from "@/components/kasa-card";
import { TopBar } from "@/components/top-bar";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { VideoBackground } from "@/components/video-background";
import { generateDemoData } from "@/lib/excel-processor";
import type { KasaCardData } from "@/lib/excel-processor";

/**
 * Algorithmic grid: pick columns/rows so there is NO empty last row.
 * 21 -> 7x3, 22 -> 6x4 (2 empty but last row has 4), 24 -> 6x4 or 8x3
 */
function computeGrid(count: number): { cols: number; rows: number } {
  // Perfect fit options
  const candidates = [
    { cols: 7, rows: 3 }, // 21
    { cols: 8, rows: 3 }, // 24
    { cols: 6, rows: 4 }, // 24
    { cols: 6, rows: 3 }, // 18
    { cols: 7, rows: 4 }, // 28
    { cols: 5, rows: 4 }, // 20
    { cols: 5, rows: 5 }, // 25
  ];

  // Find smallest grid that fits all items with no empty last row
  for (const g of candidates) {
    const total = g.cols * g.rows;
    if (total >= count) {
      // Check last row isn't empty
      const lastRowItems = count - g.cols * (g.rows - 1);
      if (lastRowItems > 0) {
        return g;
      }
    }
  }

  // Fallback: compute dynamically
  for (let cols = 6; cols <= 10; cols++) {
    const rows = Math.ceil(count / cols);
    const lastRowItems = count - cols * (rows - 1);
    if (lastRowItems > 0 && rows <= 5) {
      return { cols, rows };
    }
  }

  return { cols: 7, rows: Math.ceil(count / 7) };
}

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

  const handleVideoChange = useCallback((url: string) => {
    setVideoUrl(url);
  }, []);

  const grid = useMemo(() => computeGrid(kasaData.length), [kasaData.length]);
  const gap = screenshotMode ? "gap-1.5" : "gap-2";

  return (
    <>
      {/* Full-screen video background */}
      <VideoBackground src={videoUrl} disabled={screenshotMode} />

      <main className="relative z-10 flex h-screen flex-col overflow-hidden px-4 py-3">
        {/* Top Bar */}
        <TopBar data={kasaData} />

        {/* Separator */}
        <div className="my-2 h-px w-full bg-white/[0.06]" />

        {/* Card Grid */}
        <div
          className={`flex-1 grid ${gap}`}
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
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
      </main>

      {/* Dropdown Menu */}
      <HamburgerMenu
        onDataLoaded={handleDataLoaded}
        onReset={handleReset}
        onVideoChange={handleVideoChange}
        videoUrl={videoUrl}
        screenshotMode={screenshotMode}
        onScreenshotToggle={() => setScreenshotMode((p) => !p)}
      />
    </>
  );
}
