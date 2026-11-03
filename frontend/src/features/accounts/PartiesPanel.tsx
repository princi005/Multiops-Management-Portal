import { useState } from "react";
import { Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateParty, useParties } from "../../hooks/useAccounting";
import { getErrorMessage } from "../../lib/errors";
import type { PartyType } from "../../types/accounting";

export default function PartiesPanel() {
  const { data: parties } = useParties();
  const createParty = useCreateParty();
  const [showForm, setShowForm] = useState(false);
  const [partyType, setPartyType] = useState<PartyType>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await createParty.mutateAsync({ party_type: partyType, name: name.trim(), email: email || null });
      toast.success(`${partyType === "customer" ? "Customer" : "Vendor"} added`);
      setName("");
      setEmail("");
      setShowForm(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add party"));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Customers &amp; Vendors</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Add Party
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4 flex flex-wrap gap-2 items-end">
          <select
            value={partyType}
            onChange={(e) => setPartyType(e.target.value as PartyType)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
          </select>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm flex-1 min-w-[150px]"
          />
          <input
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm flex-1 min-w-[150px]"
          />
          <button
            onClick={handleCreate}
            disabled={createParty.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      {parties && parties.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <Users className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No customers or vendors yet.</p>
        </div>
      )}

      {parties && parties.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {parties.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.party_type === "customer"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {p.party_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.email ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}