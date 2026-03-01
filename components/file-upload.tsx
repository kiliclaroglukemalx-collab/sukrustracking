"use client";

import React, { useCallback } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (
        file &&
        (file.name.endsWith(".csv") ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls"))
      ) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border p-8 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5",
        isLoading && "pointer-events-none opacity-50"
      )}
    >
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        disabled={isLoading}
      />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Upload className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-medium text-foreground">
          Dosya yuklemek icin tiklayin veya surukleyin
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          CSV, XLS, XLSX dosyalari desteklenir
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileSpreadsheet className="h-4 w-4" />
        <span>Maksimum 10MB</span>
      </div>
    </div>
  );
}
