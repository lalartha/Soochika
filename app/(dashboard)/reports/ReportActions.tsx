"use client";

import { FileDown, Printer } from "lucide-react";

type ReportRow = {
  full_name: string;
  type: string;
  ward_number: number;
  age: number;
  priority: string;
  is_verified: boolean;
  data_collected_at?: string;
};

export default function ReportActions({ rows }: { rows: ReportRow[] }) {
  const exportCsv = () => {
    const headers = ["Name", "Type", "Ward", "Age", "Priority", "Verified", "Collection Date"];
    const csvRows = rows.map((row) => [
      row.full_name,
      row.type,
      `Ward ${row.ward_number}`,
      row.age,
      row.priority,
      row.is_verified ? "Yes" : "No",
      row.data_collected_at ?? "",
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "soochika-beneficiary-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 font-semibold"
      >
        <Printer className="h-4 w-4" />
        PDF
      </button>
      <button
        type="button"
        onClick={exportCsv}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2 font-semibold text-white"
      >
        <FileDown className="h-4 w-4" />
        Excel
      </button>
    </>
  );
}
