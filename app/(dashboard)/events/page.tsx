import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { PageShell, Panel } from "@/components/shared/page-shell";
import { createClient } from "@/lib/supabase/server";
import { events as fallbackEvents, titleCase, type Priority } from "@/lib/seed-data";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, description, event_date, location, priority_filter")
    .order("event_date", { ascending: true });

  const events = data?.length ? data : fallbackEvents;

  return (
    <PageShell
      title="Welfare Events"
      description="Plan camps and auto-identify eligible beneficiaries using ward, age, disability and priority filters."
      action={{ href: "/events/new", label: "Create Event" }}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {events.map((event) => (
          <Panel key={event.id} className="p-5">
            <h3 className="text-lg font-bold text-slate-950">{event.title}</h3>
            <p className="mt-2 min-h-16 text-base text-slate-600">{event.description}</p>
            <div className="mt-4 space-y-2 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{event.event_date}</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{event.location}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {((event.priority_filter ?? []) as Priority[]).map((priority) => (
                <span key={priority} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                  {titleCase(priority)}
                </span>
              ))}
            </div>
            <Link href={`/events/${event.id}`} className="mt-5 inline-flex font-semibold text-teal-700">
              View eligible list
            </Link>
          </Panel>
        ))}
      </div>
    </PageShell>
  );
}
