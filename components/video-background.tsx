"use client";

import { useRef, useState, useEffect } from "react";

interface VideoBackgroundProps {
  src?: string;
}

export function VideoBackground({ src }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (videoRef.current && src) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [src]);

  if (!src || hasError) {
    return <div className="fixed inset-0 z-0 bg-black" aria-hidden="true" />;
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        className="h-full w-full object-cover opacity-15"
        autoPlay
        muted
        loop
        playsInline
        onError={() => setHasError(true)}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/70" />
    </div>
  );
}
