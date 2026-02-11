"use client";

import { useState, useEffect } from "react";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return <div className="h-3" />;

  const date = now.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const time = now.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <span className="flex items-center gap-2 text-[11px] text-foreground/40">
      <span>{date}</span>
      <span className="text-foreground/15">{"/"}</span>
      <span className="font-mono tabular-nums text-foreground/55">{time}</span>
    </span>
  );
}
