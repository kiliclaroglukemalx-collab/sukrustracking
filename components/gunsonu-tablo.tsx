"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

export interface GunsonuSatir {
  yontemAdi: string;
  borc: number;
  kredi: number;
  cekimler: number;
  fark: number;
}

interface GunsonuTabloProps {
  satirlar: GunsonuSatir[];
  className?: string;
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function satirToTSV(s: GunsonuSatir): string {
  return [s.yontemAdi, formatCurrency(s.borc), formatCurrency(s.kredi), formatCurrency(s.cekimler), formatCurrency(s.fark)].join("\t");
}

function KopyalaButon({ satir, label }: { satir: GunsonuSatir; label?: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);

  const handleCopy = useCallback(async () => {
    const tsv = satirToTSV(satir);
    await navigator.clipboard.writeText(tsv);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 1500);
  }, [satir]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition-all duration-200 hover:bg-rose-200 hover:shadow-sm active:scale-[0.98]"
    >
      {kopyalandi ? (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
          Kopyalandi
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
          {label ?? "Kopyala"}
        </>
      )}
    </button>
  );
}

export function GunsonuTablo({ satirlar, className = "" }: GunsonuTabloProps) {
  const total: GunsonuSatir = satirlar.length
    ? satirlar.reduce(
        (acc, s) => ({
          yontemAdi: "Toplam",
          borc: acc.borc + s.borc,
          kredi: acc.kredi + s.kredi,
          cekimler: acc.cekimler + s.cekimler,
          fark: acc.fark + s.fark,
        }),
        { yontemAdi: "Toplam", borc: 0, kredi: 0, cekimler: 0, fark: 0 }
      )
    : { yontemAdi: "Toplam", borc: 0, kredi: 0, cekimler: 0, fark: 0 };

  return (
    <div className={`overflow-hidden rounded-xl border border-rose-200/60 bg-white/80 shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-rose-200/60 bg-rose-50/80">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-rose-800">
                Yontem
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-rose-800">
                Borc (Yatirim)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-rose-800">
                Kredi (Kasa)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-rose-800">
                Cekimler
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-rose-800">
                Fark
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-rose-800">
                Kopyala
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Total row - en ustte */}
            <tr className="border-b-2 border-rose-300/60 bg-rose-100/50 font-semibold">
              <td className="px-4 py-3 text-rose-900">{total.yontemAdi}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-900">
                {formatCurrency(total.borc)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-900">
                {formatCurrency(total.kredi)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-900">
                {formatCurrency(total.cekimler)}
              </td>
              <td
                className={`px-4 py-3 text-right font-mono tabular-nums ${
                  total.fark !== 0 ? "text-amber-600" : "text-rose-900"
                }`}
              >
                {formatCurrency(total.fark)}
              </td>
              <td className="px-4 py-3 text-center">
                <KopyalaButon satir={total} label="Toplam" />
              </td>
            </tr>
            {satirlar.map((s, i) => (
              <tr
                key={`${s.yontemAdi}-${i}`}
                className="border-b border-rose-100 transition-colors hover:bg-rose-50/50 even:bg-white/50"
              >
                <td className="px-4 py-2.5 text-neutral-800">{s.yontemAdi}</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-neutral-700">
                  {formatCurrency(s.borc)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-neutral-700">
                  {formatCurrency(s.kredi)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-neutral-700">
                  {formatCurrency(s.cekimler)}
                </td>
                <td
                  className={`px-4 py-2.5 text-right font-mono text-xs tabular-nums ${
                    s.fark !== 0 ? "font-medium text-amber-600" : "text-neutral-600"
                  }`}
                >
                  {formatCurrency(s.fark)}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <KopyalaButon satir={s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
