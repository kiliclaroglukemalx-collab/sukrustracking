"use client";

const statusMap: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  queued: { label: "Kuyrukta", bg: "bg-neutral-100", text: "text-neutral-500", dot: "bg-neutral-400" },
  running: { label: "Isleniyor", bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" },
  done: { label: "Tamamlandi", bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  error: { label: "Hata", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = statusMap[status] ?? statusMap.queued;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
