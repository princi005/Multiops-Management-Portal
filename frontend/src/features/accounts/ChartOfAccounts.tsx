import type { GLAccount } from "../../types/accounting";

const TYPE_STYLES: Record<string, string> = {
  asset: "bg-blue-50 text-blue-700",
  liability: "bg-red-50 text-red-700",
  equity: "bg-purple-50 text-purple-700",
  income: "bg-emerald-50 text-emerald-700",
  expense: "bg-amber-50 text-amber-700",
};

export default function ChartOfAccounts({ accounts }: { accounts: GLAccount[] }) {
  const topLevel = accounts.filter((a) => a.parent_account_id === null);
  const childrenOf = (parentId: string) =>
    accounts.filter((a) => a.parent_account_id === parentId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-5 py-3 font-medium">Code</th>
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Type</th>
          </tr>
        </thead>
        <tbody>
          {topLevel.map((parent) => (
            <>
              <tr key={parent.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-semibold text-slate-900">{parent.code}</td>
                <td className="px-5 py-3 font-semibold text-slate-900">{parent.name}</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_STYLES[parent.account_type]}`}
                  >
                    {parent.account_type}
                  </span>
                </td>
              </tr>
              {childrenOf(parent.id).map((child) => (
                <tr key={child.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 pl-10 text-slate-600">{child.code}</td>
                  <td className="px-5 py-3 text-slate-600">{child.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_STYLES[child.account_type]}`}
                    >
                      {child.account_type}
                    </span>
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}