"use client";

interface Column {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: "currency" | "percent" | "number" | "text";
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  caption?: string;
}

function formatCell(value: unknown, format?: string): string {
  if (value === null || value === undefined || value === "") return "\u2014";
  if (format === "currency" && typeof value === "number") {
    return `₺${new Intl.NumberFormat("tr-TR").format(value)}`;
  }
  if (format === "percent" && typeof value === "number") {
    return `%${value.toFixed(1)}`;
  }
  if (format === "number" && typeof value === "number") {
    return new Intl.NumberFormat("tr-TR").format(value);
  }
  return String(value);
}

function cellColor(value: unknown, format?: string): string {
  if (format === "currency" || format === "number" || format === "percent") {
    if (typeof value === "number") {
      if (value < 0) return "text-red-600";
      if (value > 0) return "text-emerald-700";
    }
  }
  return "text-neutral-700";
}

export function DataTable({ columns, rows, caption }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white">
      {caption && (
        <div className="border-b border-[#E6EAF0] px-5 py-3">
          <h3 className="text-xs font-bold text-neutral-800">{caption}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#F9FAFB]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap border-b border-[#E6EAF0] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="transition-colors hover:bg-[#F5F7FB]">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap border-b border-[#E6EAF0]/60 px-4 py-2.5 font-mono tabular-nums ${
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                    } ${col.format === "text" ? "font-sans font-medium text-neutral-800" : cellColor(row[col.key], col.format)}`}
                  >
                    {formatCell(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
