import { notFound } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { PageShell, Panel } from "@/components/shared/page-shell";
import { PriorityBadge } from "@/components/shared/status";
import { beneficiariesForEvent, beneficiaries as fallbackBeneficiaries, events as fallbackEvents, titleCase, type Priority } from "@/lib/seed-data";
import { createClient } from "@/lib/supabase/server";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();

  const { data: dbEvent } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  const seedEvent = fallbackEvents.find((item) => item.id === id);
  const event = dbEvent ?? seedEvent;
  if (!event) notFound();

  const { data: dbBeneficiaries } = await supabase
    .from("beneficiaries")
    .select("id, full_name, ward_number, age, type, priority, disability_details(disability_percentage)");

  const eligible = dbBeneficiaries?.length
    ? dbBeneficiaries.filter((beneficiary) => {
        const wards = event.eligibility_wards as number[] | null;
        const priorities = event.priority_filter as Priority[] | null;
        const disabilityDetails = Array.isArray(beneficiary.disability_details)
          ? beneficiary.disability_details[0]
          : beneficiary.disability_details;
        return (
          (!wards?.length || wards.includes(beneficiary.ward_number)) &&
          (!event.min_age || beneficiary.age >= event.min_age) &&
          (!event.min_disability_pct || (disabilityDetails?.disability_percentage ?? 0) >= event.min_disability_pct) &&
          (!priorities?.length || priorities.includes(beneficiary.priority as Priority))
        );
      })
    : seedEvent ? beneficiariesForEvent(id) : fallbackBeneficiaries;

  return (
    <PageShell title={event.title} description={event.description ?? ""}>
      <Panel className="p-5">
        <dl className="grid gap-4 sm:grid-cols-4">
          <div><dt className="text-sm font-semibold text-slate-500">Date</dt><dd className="font-medium">{event.event_date}</dd></div>
          <div><dt className="text-sm font-semibold text-slate-500">Location</dt><dd className="font-medium">{event.location}</dd></div>
          <div><dt className="text-sm font-semibold text-slate-500">Wards</dt><dd className="font-medium">{(event.eligibility_wards ?? []).join(", ") || "All"}</dd></div>
          <div><dt className="text-sm font-semibold text-slate-500">Eligible count</dt><dd className="font-medium">{eligible.length}</dd></div>
        </dl>
      </Panel>
      <Panel>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="font-bold text-slate-950">Eligible Beneficiaries</h3>
          <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" type="button">Download List</button>
        </div>
        <DataTable
          headers={["Name", "Ward", "Age", "Type", "Priority"]}
          rows={eligible.map((beneficiary) => [
            beneficiary.full_name,
            `Ward ${beneficiary.ward_number}`,
            beneficiary.age,
            titleCase(beneficiary.type),
            <PriorityBadge key="priority" priority={beneficiary.priority as Priority} />,
          ])}
        />
      </Panel>
    </PageShell>
  );
}
