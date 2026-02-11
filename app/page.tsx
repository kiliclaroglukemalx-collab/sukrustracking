"use client";

import { useState, useCallback, useMemo } from "react";
import { TopBar } from "@/components/top-bar";
import { KasaCard } from "@/components/kasa-card";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { VideoBackground } from "@/components/video-background";
import {
  generateDemoData,
  processExcelData,
  DEFAULT_METHODS,
} from "@/lib/excel-processor";
import type { KasaCardData, PaymentMethod } from "@/lib/excel-processor";

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
  const [methods, setMethods] = useState<PaymentMethod[]>(
    () => DEFAULT_METHODS,
  );
  const [kasaData, setKasaData] = useState<KasaCardData[]>(() =>
    generateDemoData(DEFAULT_METHODS),
  );
  const [videoUrl, setVideoUrl] = useState("");

  const handleDataLoaded = useCallback(
    (data: KasaCardData[]) => {
      setKasaData(data);
    },
    [],
  );

  const handleReset = useCallback(() => {
    setKasaData(generateDemoData(methods));
  }, [methods]);

  const handleMethodsChange = useCallback(
    (newMethods: PaymentMethod[]) => {
      setMethods(newMethods);
      // Recalculate existing data with new methods
      setKasaData((prev) => {
        const rows = prev.map((d) => ({
          odemeTuruAdi: d.odemeTuruAdi,
          borc: d.toplamBorc,
          kredi: d.toplamKredi,
        }));
        return processExcelData(rows, newMethods);
      });
    },
    [],
  );

  const grid = useMemo(() => computeGrid(kasaData.length), [kasaData.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Video behind the dark section */}
      <VideoBackground src={videoUrl} />

      {/* Hamburger menu */}
      <HamburgerMenu
        onDataLoaded={handleDataLoaded}
        onReset={handleReset}
        onVideoChange={setVideoUrl}
        videoUrl={videoUrl}
        methods={methods}
        onMethodsChange={handleMethodsChange}
      />

      {/* White top section */}
      <div className="relative z-10 flex-shrink-0 bg-white px-5 pt-3 pb-2">
        <TopBar data={kasaData} />
      </div>

      {/* Gradient transition: white -> OLED black */}
      <div
        className="relative z-10 h-6 flex-shrink-0"
        style={{
          background: "linear-gradient(to bottom, #ffffff 0%, #000000 100%)",
        }}
      />

      {/* OLED Black grid section */}
      <div
        className="relative z-10 flex flex-1 flex-col overflow-hidden"
        style={{ background: "#000000" }}
      >
        <div
          className={`grid flex-1 ${colsClass[grid.cols] || "grid-cols-7"} gap-2 p-2 pt-0`}
          style={{
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
          }}
        >
          {kasaData.map((card) => (
            <KasaCard key={card.id} data={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
