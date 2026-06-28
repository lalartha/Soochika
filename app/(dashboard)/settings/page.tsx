import Link from "next/link";
import { updateUserWard } from "@/lib/actions";
import { DataTable } from "@/components/shared/data-table";
import { PageShell, Panel } from "@/components/shared/page-shell";
import { titleCase, users as fallbackUsers } from "@/lib/seed-data";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, role, ward_number, phone, is_active")
    .order("created_at", { ascending: false });

  const users = data?.length ? data : fallbackUsers;

  return (
    <PageShell
      title="Settings"
      description="Manage staff accounts, roles, ASHA worker ward assignments and active status."
      action={{ href: "/settings/users/new", label: "Create User" }}
    >
      <Panel>
        <DataTable
          headers={["Name", "Role", "Ward", "Phone", "Status"]}
          rows={users.map((user) => [
            user.full_name,
            titleCase(user.role),
            user.ward_number ? `Ward ${user.ward_number}` : "All wards",
            user.phone ?? "Not recorded",
            user.is_active ? "Active" : "Inactive",
          ])}
        />
      </Panel>

      <Panel className="p-5">
        <h3 className="font-bold text-slate-950">Assign Ward / Role</h3>
        <p className="mt-2 max-w-3xl text-base text-slate-600">
          Admin can assign an ASHA worker or ward member to a particular ward, deactivate staff, or promote a user to admin.
        </p>
        <form action={updateUserWard} className="mt-5 grid gap-4 lg:grid-cols-5">
          <label className="space-y-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            <span>Staff member</span>
            <select name="user_id" required className="w-full rounded-md border border-slate-200 px-3 py-2 text-base">
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.full_name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Role</span>
            <select name="role" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base">
              <option value="admin">Admin</option>
              <option value="ward_member">Ward Member</option>
              <option value="asha_worker">ASHA Worker</option>
              <option value="anganwadi_worker">Anganwadi Worker</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Ward</span>
            <select name="ward_number" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base">
              <option value="">All wards</option>
              <option value="1">Ward 1</option>
              <option value="2">Ward 2</option>
            </select>
          </label>
          <div className="flex items-end gap-3">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <input name="is_active" type="checkbox" defaultChecked />
              Active
            </label>
            <button type="submit" className="rounded-md bg-teal-700 px-4 py-2 font-semibold text-white">Save</button>
          </div>
        </form>
      </Panel>

      <Panel className="p-5">
        <h3 className="font-bold text-slate-950">Access Rules</h3>
        <p className="mt-2 max-w-3xl text-base text-slate-600">
          Admin users can manage all wards, events, reports and staff accounts. Ward members and ASHA workers can register beneficiaries, update profiles and submit death reports in their ward. Admin approval is required before a death report changes the beneficiary status.
        </p>
        <Link href="/settings/users/new" className="mt-4 inline-flex font-semibold text-teal-700">
          Add another staff member
        </Link>
      </Panel>
    </PageShell>
  );
}
