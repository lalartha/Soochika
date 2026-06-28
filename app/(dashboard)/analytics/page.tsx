import { DataTable } from "@/components/shared/data-table";
import { PageShell, Panel } from "@/components/shared/page-shell";
import { PriorityBadge, RequestStatusBadge } from "@/components/shared/status";
import { beneficiaries, requests, titleCase } from "@/lib/seed-data";

export default function AnalyticsPage() {
  const wardCounts = [1, 2].map((ward) => ({
    ward,
    total: beneficiaries.filter((beneficiary) => beneficiary.ward_number === ward).length,
    high: beneficiaries.filter((beneficiary) => beneficiary.ward_number === ward && beneficiary.priority === "high").length,
  }));
  const highPriority = beneficiaries.filter((beneficiary) => beneficiary.priority === "high");
  const pending = requests.filter((request) => request.status !== "completed");

  return (
    <PageShell title="Analytics" description="Decision-support summaries for ward planning, high-priority outreach and pending services.">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Total beneficiaries", beneficiaries.length],
          ["High-priority cases", highPriority.length],
          ["Open requests", pending.length],
        ].map(([label, value]) => (
          <Panel key={label} className="p-5">
            <div className="text-sm font-semibold text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
          </Panel>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <h3 className="font-bold text-slate-950">Ward Distribution</h3>
          <div className="mt-5 space-y-4">
            {wardCounts.map((item) => (
              <div key={item.ward}>
                <div className="mb-1 flex justify-between text-sm font-semibold">
                  <span>Ward {item.ward}</span>
                  <span>{item.total} beneficiaries</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-teal-700" style={{ width: `${(item.total / beneficiaries.length) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <h3 className="font-bold text-slate-950">Open Requests</h3>
          <div className="mt-5 space-y-3">
            {pending.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                <div>
                  <div className="font-semibold">{request.beneficiary_name}</div>
                  <div className="text-sm text-slate-500">{titleCase(request.request_type)}</div>
                </div>
                <RequestStatusBadge status={request.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel>
        <div className="border-b border-slate-200 p-4">
          <h3 className="font-bold text-slate-950">High Priority Beneficiaries</h3>
        </div>
        <DataTable
          headers={["Name", "Ward", "Age", "Reason", "Priority"]}
          rows={highPriority.map((beneficiary) => [
            beneficiary.full_name,
            `Ward ${beneficiary.ward_number}`,
            beneficiary.age,
            [
              beneficiary.age > 75 ? "Age above 75" : null,
              beneficiary.health?.lives_alone ? "Lives alone" : null,
              beneficiary.health?.is_bedridden ? "Bedridden" : null,
              (beneficiary.disability?.disability_percentage ?? 0) > 70 ? "Severe disability" : null,
            ].filter(Boolean).join(", "),
            <PriorityBadge key="priority" priority={beneficiary.priority} />,
          ])}
        />
      </Panel>
    </PageShell>
  );
}
