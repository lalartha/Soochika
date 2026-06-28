import Link from "next/link";
import { DataTable } from "@/components/shared/data-table";
import { PageShell, Panel } from "@/components/shared/page-shell";
import { RequestStatusBadge } from "@/components/shared/status";
import { createClient } from "@/lib/supabase/server";
import { requests as fallbackRequests, titleCase } from "@/lib/seed-data";

import type { RequestStatus } from "@/lib/seed-data";

type RequestRow = {
  id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  request_type: string;
  status: RequestStatus;
  ward_number: number;
  notes: string;
  created_at: string;
  assigned_to: string;
};

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session as { user: { id: string } } | null;

  const { data: profile } = await supabase
    .from("users")
    .select("role, ward_number")
    .eq("id", session?.user?.id)
    .single();

  const userRole = profile?.role || "asha_worker";
  const wardNumber = profile?.ward_number;

  const { data: requestsData, error: requestsError } = await supabase
    .from("requests")
    .select("id, beneficiary_id, request_type, status, notes, assigned_to, created_at")
    .order("created_at", { ascending: false });

  let requests: RequestRow[] = [];

  if (requestsError || !requestsData) {
    console.error("Error fetching requests:", requestsError?.message);
    requests = fallbackRequests;
  } else {
    const beneficiaryIds = Array.from(new Set(requestsData.map((request) => request.beneficiary_id)));
    const { data: beneficiaries } = await supabase
      .from("beneficiaries")
      .select("id, full_name, ward_number")
      .in("id", beneficiaryIds);

    const beneficiaryMap = new Map(beneficiaries?.map((item) => [item.id, item]) ?? []);

    requests = requestsData.map((request) => {
      const beneficiary = beneficiaryMap.get(request.beneficiary_id);
      return {
        id: request.id,
        beneficiary_id: request.beneficiary_id,
        beneficiary_name: beneficiary?.full_name ?? "Unknown",
        request_type: request.request_type,
        status: request.status as RequestStatus,
        ward_number: beneficiary?.ward_number ?? 0,
        notes: request.notes ?? "",
        created_at: request.created_at ?? "",
        assigned_to: request.assigned_to ?? "Unassigned",
      };
    });
  }

  if (userRole !== "admin" && wardNumber != null) {
    requests = requests.filter((request) => request.ward_number === wardNumber);
  }

  return (
    <PageShell title="Requests" description="Track service requests from registration through completion.">
      <Panel>
        <div className="grid gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:grid-cols-3">
          <select className="rounded-md border border-slate-200 px-3 py-2 text-base" defaultValue="">
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-base" defaultValue="">
            <option value="">All request types</option>
            <option>Wheelchair</option>
            <option>Walking stick</option>
            <option>Home visit</option>
            <option>Ramp</option>
            <option>Pension support</option>
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-base" defaultValue="">
            <option value="">All wards</option>
            <option>Ward 1</option>
            <option>Ward 2</option>
          </select>
        </div>
        <DataTable
          headers={["Beneficiary", "Type", "Ward", "Status", "Assigned To", "Action"]}
          rows={requests.map((request) => [
            request.beneficiary_name,
            titleCase(request.request_type),
            `Ward ${request.ward_number}`,
            <RequestStatusBadge key="status" status={request.status} />,
            request.assigned_to,
            <Link key="action" href={`/requests/${request.id}`} className="font-semibold text-teal-700">
              View
            </Link>,
          ])}
        />
      </Panel>
    </PageShell>
  );
}
