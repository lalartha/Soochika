import { DataTable } from "@/components/shared/data-table";
import { PageShell, Panel } from "@/components/shared/page-shell";
import { PriorityBadge } from "@/components/shared/status";
import { beneficiaries, titleCase } from "@/lib/seed-data";
import ReportActions from "./ReportActions";

export default function ReportsPage() {
  return (
    <PageShell title="Reports" description="Export filtered beneficiary and service information for Panchayat review meetings.">
      <Panel className="p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <select className="rounded-md border border-slate-200 px-3 py-2 text-base" defaultValue="">
            <option value="">All wards</option>
            <option>Ward 1</option>
            <option>Ward 2</option>
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-base" defaultValue="">
            <option value="">All priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <ReportActions rows={beneficiaries} />
        </div>
      </Panel>
      <Panel>
        <DataTable
          headers={["Name", "Type", "Ward", "Age", "Collection", "Priority", "Verified"]}
          rows={beneficiaries.map((beneficiary) => [
            beneficiary.full_name,
            titleCase(beneficiary.type),
            `Ward ${beneficiary.ward_number}`,
            beneficiary.age,
            beneficiary.data_collected_at,
            <PriorityBadge key="priority" priority={beneficiary.priority} />,
            beneficiary.is_verified ? "Yes" : "No",
          ])}
        />
      </Panel>
    </PageShell>
  );
}
