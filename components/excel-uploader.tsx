"use client";

import React from "react"

import { useCallback, useRef } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import type { KasaCardData } from "@/lib/excel-processor";
import { parseExcelFile, processExcelData } from "@/lib/excel-processor";

interface ExcelUploaderProps {
  onDataLoaded: (data: KasaCardData[]) => void;
}

export function ExcelUploader({ onDataLoaded }: ExcelUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const buffer = await file.arrayBuffer();
      const rows = parseExcelFile(buffer);
      const processed = processExcelData(rows);
      onDataLoaded(processed);
    },
    [onDataLoaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      role="button"
      tabIndex={0}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-200 px-3 py-4 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
    >
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-emerald-600/70" strokeWidth={1.5} />
        <Upload className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-[11px] font-medium text-neutral-600">
          Excel Dosyasi Yukle
        </p>
        <p className="mt-0.5 text-[9px] text-neutral-400">
          .xlsx, .xls veya .csv
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
        aria-label="Excel dosyasi yukle"
      />
    </div>
  );
}
