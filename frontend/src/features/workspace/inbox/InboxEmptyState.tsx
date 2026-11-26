import { Inbox } from "lucide-react";

export default function InboxEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
        <Inbox className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-bold">{filtered ? "No matching notifications" : "Your inbox is clear"}</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {filtered ? "Try another filter or search term." : "Project updates, requests, comments, and announcements will appear here."}
      </p>
    </div>
  );
}
