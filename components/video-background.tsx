"use client";

import { useRef, useState, useEffect } from "react";

interface VideoBackgroundProps {
  src?: string;
}

export function VideoBackground({ src }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (videoRef.current && src) {
      videoRef.current.play().catch(() => {
        // autoplay may be blocked
      });
    }
  }, [src]);

  // If no src provided, show empty dark background
  if (!src) {
    return (
      <div
        className="fixed inset-0 z-0 bg-black"
        aria-hidden="true"
      />
    );
  }

  if (hasError) {
    return (
      <div
        className="fixed inset-0 z-0 bg-black"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        onError={() => setHasError(true)}
      >
        <source src={src} type="video/mp4" />
      </video>
      {/* Dark overlay so cards remain legible */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
