"use client";

import { useState, useCallback } from "react";
import { LiveClock } from "@/components/live-clock";
import { KasaCard } from "@/components/kasa-card";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { TopBar } from "@/components/top-bar";
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
      <VideoBackground src={videoUrl} />

      <main className="relative z-10 flex h-screen flex-col px-3 py-2">
        {/* Hamburger Menu - absolute top right */}
        <HamburgerMenu
          onDataLoaded={handleDataLoaded}
          onReset={handleReset}
          onVideoChange={handleVideoChange}
          videoUrl={videoUrl}
        />

        {/* Top Bar: Title + Clock + Totals */}
        <TopBar data={kasaData} />

        {/* Thin separator */}
        <div className="my-1.5 h-px w-full bg-white/10" />

        {/* Card Grid - fills remaining height */}
        <div className="grid flex-1 grid-cols-4 grid-rows-6 gap-1.5 md:grid-cols-6 md:grid-rows-4 lg:grid-cols-8 lg:grid-rows-3">
          {kasaData.map((card) => (
            <KasaCard key={card.id} data={card} />
          ))}
        </div>
      </main>
    </>
  );
}
