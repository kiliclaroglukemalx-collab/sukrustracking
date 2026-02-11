"use client";

import { useRef, useState, useEffect } from "react";

interface VideoBackgroundProps {
  src?: string;
  disabled?: boolean;
}

export function VideoBackground({ src, disabled }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (videoRef.current && src) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [src]);

  if (!src || hasError || disabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        className="h-full w-full object-cover opacity-[0.06] blur-[2px] grayscale"
        autoPlay
        muted
        loop
        playsInline
        onError={() => setHasError(true)}
      >
        <source src={src} type="video/mp4" />
      </video>
      {/* White overlay to keep the light theme */}
      <div className="absolute inset-0 bg-white/85" />
    </div>
  );
}
