"use client";

import { useState, useCallback } from "react";
import { LiveClock } from "@/components/live-clock";
import { KasaCard } from "@/components/kasa-card";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { SummaryBar } from "@/components/summary-bar";
import { generateDemoData } from "@/lib/excel-processor";
import type { KasaCardData } from "@/lib/excel-processor";

export default function Page() {
  const [kasaData, setKasaData] = useState<KasaCardData[]>(() =>
    generateDemoData(),
  );

  const handleDataLoaded = useCallback((data: KasaCardData[]) => {
    setKasaData(data);
  }, []);

  const handleReset = useCallback(() => {
    setKasaData(generateDemoData());
  }, []);

  return (
    <main className="relative min-h-screen bg-background p-4 pb-8 md:p-6 lg:p-8">
      {/* Hamburger Menu - Top Right */}
      <HamburgerMenu onDataLoaded={handleDataLoaded} onReset={handleReset} />

      {/* Title Section */}
      <div className="mb-8 flex flex-col items-center pt-2">
        <h1 className="mb-2 text-2xl font-bold tracking-[0.3em] uppercase text-foreground md:text-3xl">
          Saatlik Kasa
        </h1>
        <div className="mb-1 h-px w-24 bg-border" />
        <LiveClock />
      </div>

      {/* Summary Bar */}
      <div className="mb-6">
        <SummaryBar data={kasaData} />
      </div>

      {/* Kasa Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kasaData.map((card) => (
          <KasaCard key={card.id} data={card} />
        ))}
      </div>

      {/* Empty State */}
      {kasaData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">Veri bulunamadi</p>
          <p className="mt-1 text-sm">
            Sag ustteki menu ile Excel dosyasi yukleyin
          </p>
        </div>
      )}
    </main>
  );
}
