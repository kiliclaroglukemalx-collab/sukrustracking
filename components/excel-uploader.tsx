"use client";

import React from "react"

import { useCallback, useRef } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
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
      className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-muted-foreground/50 hover:bg-secondary/30"
    >
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-5 w-5 text-accent" />
        <Upload className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Excel Dosyasi Yukle
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {"Surukle & birak veya tiklayarak sec (.xlsx, .xls)"}
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
