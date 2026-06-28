import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, Panel } from "@/components/shared/page-shell";
import { RequestStatusBadge } from "@/components/shared/status";
import { createClient } from "@/lib/supabase/server";
import { requests as fallbackRequests, titleCase, type RequestStatus } from "@/lib/seed-data";
import UpdateRequestForm from "./UpdateRequestForm";

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select("id, beneficiary_id, request_type, status, notes, other_details, assigned_to, created_at")
    .eq("id", id)
    .single();

  const fallback = fallbackRequests.find((item) => item.id === id);
  const record = request ?? fallback;
  if (requestError && !fallback) notFound();
  if (!record) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user?.id)
    .single();

  const { data: beneficiary, error: beneficiaryError } = await supabase
    .from("beneficiaries")
    .select("full_name, ward_number")
    .eq("id", record.beneficiary_id)
    .single();

  const beneficiaryName = beneficiary?.full_name ?? ("beneficiary_name" in record ? record.beneficiary_name : "Unknown beneficiary");
  const wardNumber = beneficiary?.ward_number ?? ("ward_number" in record ? record.ward_number : 0);

  return (
    <PageShell title="Request Detail" description={`Request for ${beneficiaryName}.`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-950">{titleCase(record.request_type)}</h3>
              <p className="mt-1 text-slate-600">{record.notes}</p>
            </div>
            <RequestStatusBadge status={record.status as RequestStatus} />
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["Beneficiary", beneficiaryName],
              ["Ward", `Ward ${wardNumber}`],
              ["Raised on", record.created_at],
              ["Assigned to", record.assigned_to ?? "Unassigned"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm font-semibold text-slate-500">{label}</dt>
                <dd className="mt-1 text-base font-medium text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>
          <Link href={`/beneficiaries/${record.beneficiary_id}`} className="mt-6 inline-flex font-semibold text-teal-700">
            Open beneficiary profile
          </Link>
        </Panel>
        <Panel className="p-5">
          <UpdateRequestForm
            isAdmin={profile?.role === "admin"}
            request={{
              id: record.id,
              beneficiary_id: record.beneficiary_id,
              request_type: record.request_type,
              status: record.status as RequestStatus,
              notes: record.notes ?? "",
              other_details: "other_details" in record ? record.other_details : null,
            }}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
