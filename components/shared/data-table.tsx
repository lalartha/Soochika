import type { ReactNode } from "react";

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-base">
        <thead className="bg-slate-50 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="text-slate-800 dark:text-zinc-100">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-4 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
