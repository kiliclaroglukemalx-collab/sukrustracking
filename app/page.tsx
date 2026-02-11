"use client";

import { useState, useCallback } from "react";
import { LiveClock } from "@/components/live-clock";
import { KasaCard } from "@/components/kasa-card";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { SummaryBar } from "@/components/summary-bar";
import { VideoBackground } from "@/components/video-background";
import { generateDemoData } from "@/lib/excel-processor";
import type { KasaCardData } from "@/lib/excel-processor";

export default function Page() {
  const [kasaData, setKasaData] = useState<KasaCardData[]>(() =>
    generateDemoData(),
  );
  const [videoUrl, setVideoUrl] = useState("");

  const handleDataLoaded = useCallback((data: KasaCardData[]) => {
    setKasaData(data);
  }, []);

  const handleReset = useCallback(() => {
    setKasaData(generateDemoData());
  }, []);

  const handleVideoChange = useCallback((url: string) => {
    setVideoUrl(url);
  }, []);

  return (
    <>
      {/* Full-screen video background */}
      <VideoBackground src={videoUrl} />

      {/* Content overlay */}
      <main className="relative z-10 flex h-screen flex-col overflow-hidden px-3 pb-3 pt-2">
        {/* Hamburger Menu */}
        <HamburgerMenu
          onDataLoaded={handleDataLoaded}
          onReset={handleReset}
          onVideoChange={handleVideoChange}
          videoUrl={videoUrl}
        />

        {/* Title Row - Compact */}
        <div className="mb-2 flex flex-col items-center">
          <h1 className="text-sm font-bold tracking-[0.3em] uppercase text-white md:text-base">
            Saatlik Kasa
          </h1>
          <LiveClock />
        </div>

        {/* Summary Bar */}
        <div className="mb-2">
          <SummaryBar data={kasaData} />
        </div>

        {/* Separator */}
        <div className="mb-2 border-t border-white/[0.06]" />

        {/* 21-Card Grid: 7 columns x 3 rows, fills remaining space */}
        <div className="grid flex-1 grid-cols-3 grid-rows-7 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 lg:grid-rows-3">
          {kasaData.map((card) => (
            <KasaCard key={card.id} data={card} />
          ))}
        </div>

        {/* Empty State */}
        {kasaData.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-white/40">
            <p className="text-sm">Veri bulunamadi</p>
            <p className="mt-1 text-[10px]">
              Sag ustteki menu ile Excel dosyasi yukleyin
            </p>
          </div>
        )}
      </main>
    </>
  );
}
