import { CHANGE_FIELD_LABELS } from "../types/profileChange";
import type { ChangeRequest } from "../types/profileChange";

// Shows what was asked for. Free-text requests are shown as written; the older
// name/phone requests are shown as "Name: old -> new".
export default function ChangeRequestText({ request }: { request: ChangeRequest }) {
  if (request.field === "general") {
    return <p className="text-slate-900 whitespace-pre-line">{request.new_value}</p>;
  }
  return (
    <p className="text-slate-600">
      <span className="font-medium text-slate-900">{CHANGE_FIELD_LABELS[request.field]}: </span>
      <span className="text-slate-400">{request.old_value || "(empty)"}</span>
      {" \u2192 "}
      <span className="text-slate-900">{request.new_value}</span>
    </p>
  );
}