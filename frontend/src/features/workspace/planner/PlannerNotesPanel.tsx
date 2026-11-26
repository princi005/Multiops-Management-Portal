import AppButton from "../../../components/ui/AppButton";

export default function PlannerNotesPanel({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor="planner-note" className="sr-only">Personal planner notes</label>
      <textarea
        id="planner-note"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={4000}
        rows={10}
        placeholder="Write a personal note or reminder…"
        className="w-full resize-y rounded-xl border border-slate-200 bg-white/80 p-4 text-sm leading-6"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Notes remain in this page preview and are not saved to a server.</p>
        <AppButton type="button" variant="ghost" onClick={() => onChange("")}>Clear</AppButton>
      </div>
    </div>
  );
}
