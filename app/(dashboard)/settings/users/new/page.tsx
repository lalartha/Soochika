import { createUser } from "@/lib/actions";
import { PageShell, Panel } from "@/components/shared/page-shell";

export default function NewUserPage() {
  return (
    <PageShell title="Create User" description="Invite a Panchayat staff member and assign the correct role and ward scope.">
      <Panel className="p-5">
        <form action={createUser} className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Full name</span>
            <input name="full_name" required className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Email</span>
            <input name="email" required type="email" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Phone</span>
            <input name="phone" type="tel" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Temporary password</span>
            <input name="password" type="text" defaultValue="Password@123" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
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
          <div className="lg:col-span-2 flex justify-end">
            <button type="submit" className="rounded-md bg-teal-700 px-4 py-2 font-semibold text-white">Create Account</button>
          </div>
        </form>
      </Panel>
    </PageShell>
  );
}
