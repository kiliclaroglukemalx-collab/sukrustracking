"use client";

import { useState, useEffect } from "react";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return <div className="h-6" />;

  const day = now.toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const time = now.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm tracking-widest uppercase text-muted-foreground">
        {day}
      </span>
      <span className="text-3xl font-mono font-bold tracking-wider tabular-nums">
        {time}
      </span>
    </div>
  );
}
