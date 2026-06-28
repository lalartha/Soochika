import { notFound } from "next/navigation";
import { updateBeneficiary } from "@/lib/actions";
import { PageShell, Panel } from "@/components/shared/page-shell";
import { beneficiaries as fallbackBeneficiaries } from "@/lib/seed-data";
import { createClient } from "@/lib/supabase/server";

export default async function EditBeneficiaryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data: beneficiary } = await supabase
    .from("beneficiaries")
    .select("id, full_name, address, ward_number, phone, emergency_contact, is_verified, data_collected_at")
    .eq("id", id)
    .single();

  const fallback = fallbackBeneficiaries.find((item) => item.id === id);
  const record = beneficiary ?? fallback;
  if (!record) notFound();

  return (
    <PageShell title="Edit Beneficiary" description={`Update profile and verification details for ${record.full_name}.`}>
      <Panel className="p-5">
        <form action={updateBeneficiary} className="grid gap-5 lg:grid-cols-2">
          <input type="hidden" name="id" value={record.id} />
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Full name</span>
            <input name="full_name" defaultValue={record.full_name} className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Ward</span>
            <select name="ward_number" defaultValue={record.ward_number} className="w-full rounded-md border border-slate-200 px-3 py-2 text-base">
              <option value="1">Ward 1</option>
              <option value="2">Ward 2</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Phone</span>
            <input name="phone" defaultValue={record.phone ?? ""} className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Emergency contact</span>
            <input name="emergency_contact" defaultValue={record.emergency_contact ?? ""} className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Date of collection</span>
            <input name="data_collected_at" type="date" defaultValue={record.data_collected_at ?? ""} className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            <span>Address</span>
            <input name="address" defaultValue={record.address} className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="flex items-center gap-2 text-base font-semibold">
            <input name="is_verified" type="checkbox" defaultChecked={record.is_verified} className="h-4 w-4" />
            Mark as verified
          </label>
          <div className="lg:col-span-2 flex justify-end">
            <button type="submit" className="rounded-md bg-teal-700 px-4 py-2 font-semibold text-white">Save Changes</button>
          </div>
        </form>
      </Panel>
    </PageShell>
  );
}
