"use client";

import { useRef, useState } from "react";
import {
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Minus,
  Video,
} from "lucide-react";
import type { KasaCardData } from "@/lib/excel-processor";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);
}

interface KasaCardProps {
  data: KasaCardData;
}

export function KasaCard({ data }: KasaCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const isPositive = data.kalanKasa > 0;
  const isNegative = data.kalanKasa < 0;

  return (
    <div className="group relative flex flex-col rounded-lg border border-border bg-card p-4 transition-all hover:border-muted-foreground/30 hover:bg-secondary/50">
      {/* Video Area */}
      <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-md bg-background">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          onLoadedData={() => setHasVideo(true)}
          onError={() => setHasVideo(false)}
          muted
          loop
          playsInline
        >
          <source src="" type="video/mp4" />
        </video>

        {!hasVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Video className="h-6 w-6" />
            <span className="text-xs">Video yukleyin</span>
          </div>
        )}

        {hasVideo && (
          <button
            onClick={togglePlay}
            type="button"
            className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition-opacity group-hover:opacity-100"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-foreground" />
            ) : (
              <Play className="h-8 w-8 text-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Payment Type Name */}
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
        {data.odemeTuruAdi}
      </h3>

      {/* Financial Details */}
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Borc</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(data.toplamBorc)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            Komisyon (%{data.komisyonOrani})
          </span>
          <span className="font-mono font-medium text-destructive">
            -{formatCurrency(data.komisyon)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Net Borc</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(data.netBorc)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Kredi</span>
          <span className="font-mono font-medium text-destructive">
            -{formatCurrency(data.toplamKredi)}
          </span>
        </div>

        {/* Divider */}
        <div className="my-1 border-t border-border" />

        {/* Kalan Kasa - Main Result */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Kalan Kasa
          </span>
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
            ) : isNegative ? (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span
              className={`font-mono text-base font-bold ${
                isPositive
                  ? "text-accent"
                  : isNegative
                    ? "text-destructive"
                    : "text-foreground"
              }`}
            >
              {formatCurrency(data.kalanKasa)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
