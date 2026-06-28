import { createEvent } from "@/lib/actions";
import { PageShell, Panel } from "@/components/shared/page-shell";

export default function NewEventPage() {
  return (
    <PageShell title="Create Welfare Event" description="Define eligibility filters and generate a beneficiary list for a camp or service drive.">
      <Panel className="p-5">
        <form action={createEvent} className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Event title</span>
            <input name="title" required className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Event date</span>
            <input name="event_date" required type="date" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            <span>Location</span>
            <input name="location" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700 lg:col-span-2">
            <span>Description</span>
            <textarea name="description" className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Minimum age</span>
            <input name="min_age" type="number" min="0" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Minimum disability percentage</span>
            <input name="min_disability_pct" type="number" min="0" max="100" className="w-full rounded-md border border-slate-200 px-3 py-2 text-base" />
          </label>
          <fieldset className="rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-bold text-slate-800">Eligible wards</legend>
            <div className="mt-3 flex flex-wrap gap-4">
              {[1, 2].map((ward) => (
                <label key={ward} className="flex items-center gap-2 text-base">
                  <input name="eligibility_wards" type="checkbox" value={ward} defaultChecked />
                  Ward {ward}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-bold text-slate-800">Priority filter</legend>
            <div className="mt-3 flex flex-wrap gap-4">
              {["high", "medium", "low"].map((priority) => (
                <label key={priority} className="flex items-center gap-2 text-base capitalize">
                  <input name="priority_filter" type="checkbox" value={priority} defaultChecked={priority !== "low"} />
                  {priority}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="lg:col-span-2 flex justify-end">
            <button type="submit" className="rounded-md bg-teal-700 px-4 py-2 font-semibold text-white">Create Event</button>
          </div>
        </form>
      </Panel>
    </PageShell>
  );
}
