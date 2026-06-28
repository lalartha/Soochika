import Link from "next/link";
import { notFound } from "next/navigation";
import { createRequest, reportDeath } from "@/lib/actions";
import { DataTable } from "@/components/shared/data-table";
import { PageShell, Panel } from "@/components/shared/page-shell";
import { PriorityBadge, RequestStatusBadge } from "@/components/shared/status";
import { beneficiaries as fallbackBeneficiaries, requests as fallbackRequests, titleCase, type RequestStatus } from "@/lib/seed-data";
import { createClient } from "@/lib/supabase/server";

export default async function BeneficiaryProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();

  const { data: dbBeneficiary } = await supabase
    .from("beneficiaries")
    .select("*, health_details(*), disability_details(*)")
    .eq("id", id)
    .single();

  const seedBeneficiary = fallbackBeneficiaries.find((item) => item.id === id);
  const beneficiary = dbBeneficiary ?? seedBeneficiary;
  if (!beneficiary) notFound();

  const health = "health_details" in beneficiary
    ? Array.isArray(beneficiary.health_details) ? beneficiary.health_details[0] : beneficiary.health_details
    : beneficiary.health;
  const disability = "disability_details" in beneficiary
    ? Array.isArray(beneficiary.disability_details) ? beneficiary.disability_details[0] : beneficiary.disability_details
    : beneficiary.disability;

  const { data: dbRequests } = await supabase
    .from("requests")
    .select("id, request_type, status, notes, other_details, created_at")
    .eq("beneficiary_id", id)
    .order("created_at", { ascending: false });

  const beneficiaryRequests = dbRequests?.length
    ? dbRequests.map((request) => ({
        id: request.id,
        request_type: request.request_type,
        status: request.status as RequestStatus,
        notes: request.notes ?? "",
      }))
    : fallbackRequests.filter((request) => request.beneficiary_id === id);

  return (
    <PageShell
      title={beneficiary.full_name}
      description={`${titleCase(beneficiary.type)} beneficiary in Ward ${beneficiary.ward_number}.`}
      action={{ href: `/beneficiaries/${beneficiary.id}/edit`, label: "Edit Profile" }}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <PriorityBadge priority={beneficiary.priority} />
            <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700">
              {beneficiary.is_deceased ? `Deceased${beneficiary.death_date ? ` on ${beneficiary.death_date}` : ""}` : beneficiary.is_verified ? "Verified" : "Verification pending"}
            </span>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["Age", beneficiary.age],
              ["Gender", titleCase(beneficiary.gender)],
              ["Phone", beneficiary.phone ?? "Not recorded"],
              ["Emergency contact", beneficiary.emergency_contact ?? "Not recorded"],
              ["Date of collection", beneficiary.data_collected_at ?? "Not recorded"],
              ["Address", beneficiary.address],
              ["Ward", `Ward ${beneficiary.ward_number}`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm font-semibold text-slate-500">{label}</dt>
                <dd className="mt-1 text-base font-medium text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel className="p-5">
          <h3 className="font-bold text-slate-950">Care Details</h3>
          <div className="mt-4 space-y-4 text-base">
            {health ? (
              <div>
                <div className="font-semibold">Health</div>
                <p className="text-slate-600">
                  {health.chronic_diseases?.join(", ") || "No chronic disease noted"}. Pension: {health.pension_status || "Unknown"}.
                </p>
                {health.notes ? (
                  <p className="mt-2 text-slate-600">Other health notes: {health.notes}</p>
                ) : null}
              </div>
            ) : null}
            {disability ? (
              <div>
                <div className="font-semibold">Disability</div>
                <p className="text-slate-600">
                  {titleCase(disability.disability_type)}, {disability.disability_percentage}%. Devices: {disability.assistive_devices?.join(", ") || "None"}.
                </p>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel>
          <div className="border-b border-slate-200 p-4">
            <h3 className="font-bold text-slate-950">Requests</h3>
          </div>
          <DataTable
            headers={["Type", "Status", "Notes", "Action"]}
            rows={beneficiaryRequests.map((request) => [
              titleCase(request.request_type),
              <RequestStatusBadge key="status" status={request.status} />,
              request.notes,
              <Link key="action" href={`/requests/${request.id}`} className="font-semibold text-teal-700">Open</Link>,
            ])}
          />
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5">
            <h3 className="font-bold text-slate-950">Add Request</h3>
            <form action={createRequest} className="mt-4 space-y-3">
              <input type="hidden" name="beneficiary_id" value={beneficiary.id} />
              <select name="request_type" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base">
                <option value="wheelchair">Wheelchair</option>
                <option value="walking_stick">Walking stick</option>
                <option value="home_visit">Home visit</option>
                <option value="ramp">Ramp</option>
                <option value="pension_support">Pension support</option>
                <option value="other">Other</option>
              </select>
              <input name="other_details" placeholder="Other request details" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
              <textarea name="notes" placeholder="Notes" className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
              <button className="w-full rounded-md bg-teal-700 px-4 py-2 font-semibold text-white">Add Request</button>
            </form>
          </Panel>

          <Panel className="p-5">
            <h3 className="font-bold text-slate-950">Report Death</h3>
            <p className="mt-1 text-sm text-slate-600">ASHA or ward staff can submit this. Admin approval marks the beneficiary deceased.</p>
            <form action={reportDeath} className="mt-4 space-y-3">
              <input type="hidden" name="beneficiary_id" value={beneficiary.id} />
              <input name="death_date" required type="date" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
              <textarea name="notes" placeholder="Verification note" className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
              <button className="w-full rounded-md border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700">Submit death report</button>
            </form>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
