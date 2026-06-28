import { titleCase, type Priority, type RequestStatus } from "@/lib/seed-data";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-16 items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset",
        priority === "high" && "bg-red-50 text-red-700 ring-red-200",
        priority === "medium" && "bg-amber-50 text-amber-700 ring-amber-200",
        priority === "low" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
      )}
    >
      {titleCase(priority)}
    </span>
  );
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-24 items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset",
        status === "pending" && "bg-amber-50 text-amber-700 ring-amber-200",
        status === "in_progress" && "bg-blue-50 text-blue-700 ring-blue-200",
        status === "completed" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
      )}
    >
      {titleCase(status)}
    </span>
  );
}
