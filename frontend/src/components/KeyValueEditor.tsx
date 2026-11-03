import { Plus, Trash2 } from "lucide-react";

export interface KeyValueRow {
  label: string;
  amount: number;
}

export function recordToRows(record: Record<string, number>): KeyValueRow[] {
  return Object.entries(record).map(([label, amount]) => ({ label, amount }));
}

export function rowsToRecord(rows: KeyValueRow[]): Record<string, number> {
  const record: Record<string, number> = {};
  for (const row of rows) {
    if (row.label.trim() !== "" && row.amount > 0) {
      record[row.label.trim()] = row.amount;
    }
  }
  return record;
}

export default function KeyValueEditor({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
}) {
  const update = (index: number, patch: Partial<KeyValueRow>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };
  const add = () => onChange([...rows, { label: "", amount: 0 }]);
  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <div>
      <p className="text-xs font-medium text-slate-600 mb-1">{title}</p>
      <div className="space-y-1">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={row.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Label"
              className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <input
              type="number"
              min="0"
              value={row.amount || ""}
              onChange={(e) => update(i, { amount: Number(e.target.value) || 0 })}
              placeholder="Amount"
              className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button onClick={() => remove(i)} className="text-slate-400 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} className="flex items-center gap-1 text-xs font-medium mt-1 text-violet-600">
        <Plus className="w-3.5 h-3.5" />
        Add
      </button>
    </div>
  );
}