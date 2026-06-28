import { approveDeathReport, updateRequest } from "@/lib/actions";
import { RequestStatusBadge } from "@/components/shared/status";
import type { RequestStatus } from "@/lib/seed-data";

type UpdateRequestFormProps = {
  request: {
    id: string;
    beneficiary_id: string;
    request_type: string;
    status: RequestStatus;
    notes: string;
    other_details?: string | null;
  };
  isAdmin: boolean;
};

export default function UpdateRequestForm({ request, isAdmin }: UpdateRequestFormProps) {
  return (
    <div className="space-y-6">
      <form action={updateRequest} className="space-y-4">
        <input type="hidden" name="id" value={request.id} />
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-950">Update Status</h3>
          <RequestStatusBadge status={request.status} />
        </div>
        <select name="status" defaultValue={request.status} className="w-full rounded-md border border-slate-200 px-3 py-2 text-base">
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <textarea
          name="notes"
          defaultValue={request.notes}
          className="min-h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-base"
          placeholder="Add a status note"
        />
        <button type="submit" className="w-full rounded-md bg-teal-700 px-4 py-2 font-semibold text-white">
          Save Update
        </button>
      </form>

      {isAdmin && request.request_type === "death_report" && request.status !== "completed" ? (
        <form action={approveDeathReport} className="rounded-lg border border-red-200 bg-red-50 p-4">
          <input type="hidden" name="request_id" value={request.id} />
          <input type="hidden" name="beneficiary_id" value={request.beneficiary_id} />
          <input type="hidden" name="death_date" value={request.other_details ?? ""} />
          <h3 className="font-bold text-red-900">Approve Death Report</h3>
          <p className="mt-1 text-sm text-red-700">
            This will mark the beneficiary as deceased and complete the request.
          </p>
          <button type="submit" className="mt-4 w-full rounded-md bg-red-700 px-4 py-2 font-semibold text-white">
            Approve and mark deceased
          </button>
        </form>
      ) : null}
    </div>
  );
}
