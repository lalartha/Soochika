import { PageShell, Panel } from "@/components/shared/page-shell";
import { createBeneficiary } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

export default async function NewBeneficiaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("role, ward_number")
    .eq("id", user?.id)
    .single();

  return (
    <PageShell
      title="Register Beneficiary"
      description="Capture profile, collection date, health details, disability details and field verification status."
    >
      <Panel className="p-5">
        <form action={createBeneficiary} className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Full name</span>
            <input name="full_name" required className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Date of birth</span>
            <input name="date_of_birth" required type="date" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Date of collection</span>
            <input
              name="data_collected_at"
              required
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-base"
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Phone</span>
            <input name="phone" type="tel" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Emergency contact</span>
            <input name="emergency_contact" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Gender</span>
            <select name="gender" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            <span>Address</span>
            <input name="address" required className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Beneficiary type</span>
            <select name="type" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base">
              <option value="elderly">Elderly</option>
              <option value="pwd">PwD</option>
              <option value="both">Both</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Ward</span>
            {profile?.role === "admin" ? (
              <select name="ward_number" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base">
                <option value="1">Ward 1</option>
                <option value="2">Ward 2</option>
              </select>
            ) : (
              <>
                <input
                  value={profile?.ward_number ? `Ward ${profile.ward_number}` : "Ward not assigned"}
                  disabled
                  className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-base"
                />
                <input type="hidden" name="ward_number" value={profile?.ward_number ?? ""} />
              </>
            )}
          </label>

          <fieldset className="rounded-lg border border-slate-200 p-4 lg:col-span-2">
            <legend className="px-1 text-sm font-bold text-slate-800">Health details</legend>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="grid gap-3">
                <label className="flex items-center gap-2 text-base"><input name="lives_alone" type="checkbox" /> Lives alone</label>
                <label className="flex items-center gap-2 text-base"><input name="is_bedridden" type="checkbox" /> Bedridden</label>
                <label className="flex items-center gap-2 text-base"><input name="is_verified" type="checkbox" /> Field verified</label>
              </div>
              <div className="grid gap-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-sm font-semibold text-slate-700">Lifestyle / chronic conditions</div>
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center gap-2 text-base"><input name="chronic_diseases" type="checkbox" value="Diabetes" /> Diabetes</label>
                    <label className="flex items-center gap-2 text-base"><input name="chronic_diseases" type="checkbox" value="Blood pressure" /> Blood pressure</label>
                    <label className="flex items-center gap-2 text-base"><input name="chronic_diseases" type="checkbox" value="Cholesterol" /> Cholesterol</label>
                  </div>
                </div>
                <input name="other_diseases" placeholder="Other diseases or notes" className="rounded-md border border-slate-200 px-3 py-2 text-base" />
              </div>
              <input name="pension_status" placeholder="Pension status" className="rounded-md border border-slate-200 px-3 py-2 text-base" />
              <input name="last_health_check" type="date" className="rounded-md border border-slate-200 px-3 py-2 text-base" />
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-slate-200 p-4 lg:col-span-2">
            <legend className="px-1 text-sm font-bold text-slate-800">Disability details</legend>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <select name="disability_type" className="rounded-md border border-slate-200 px-3 py-2 text-base">
                <option value="other">Other</option>
                <option value="visual">Visual</option>
                <option value="hearing">Hearing</option>
                <option value="locomotor">Locomotor</option>
                <option value="intellectual">Intellectual</option>
                <option value="multiple">Multiple</option>
              </select>
              <input name="disability_percentage" type="number" min="0" max="100" placeholder="Disability %" className="rounded-md border border-slate-200 px-3 py-2 text-base" />
              <input name="certificate_number" placeholder="Certificate no." className="rounded-md border border-slate-200 px-3 py-2 text-base" />
              <input name="assistive_devices" placeholder="Devices, comma separated" className="rounded-md border border-slate-200 px-3 py-2 text-base" />
              <label className="flex items-center gap-2 text-base"><input name="has_caregiver" type="checkbox" /> Has caregiver</label>
              <input name="caregiver_name" placeholder="Caregiver name" className="rounded-md border border-slate-200 px-3 py-2 text-base" />
              <input name="caregiver_phone" placeholder="Caregiver phone" className="rounded-md border border-slate-200 px-3 py-2 text-base" />
            </div>
          </fieldset>

          {profile?.role !== "admin" && profile?.ward_number == null ? (
            <div className="lg:col-span-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Your account has no assigned ward. Ask an admin to assign your ward before registering beneficiaries.
            </div>
          ) : null}

          <div className="lg:col-span-2 flex justify-end">
            <button type="submit" className="rounded-md bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-600">
              Register
            </button>
          </div>
        </form>
      </Panel>
    </PageShell>
  );
}
