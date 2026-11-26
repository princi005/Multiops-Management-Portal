import { useState } from "react";
import { useActiveOrganization } from "../../hooks/useActiveOrganizationInfo";

type TemplateTheme = "light" | "dark";
type DocumentKind = "salary-slip" | "invoice";

function downloadTemplate(kind: DocumentKind, theme: TemplateTheme) {
  const title = kind === "salary-slip" ? "Salary slip template" : "Salary invoice template";
  const background = theme === "dark" ? "#111827" : "#ffffff";
  const foreground = theme === "dark" ? "#f9fafb" : "#111827";
  const border = theme === "dark" ? "#374151" : "#dbe3ef";
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
body{font:16px Arial,sans-serif;background:${background};color:${foreground};padding:32px}
main{max-width:800px;margin:auto;border:1px solid ${border};border-radius:16px;padding:28px}
header{border-bottom:1px solid ${border};padding-bottom:16px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px}
.muted{opacity:.7}
button{margin-top:24px;padding:10px 16px;border-radius:8px}
@media print{button{display:none}body{padding:0}}
</style>
</head>
<body>
<main>
<header><strong>MULTIOPS · SAMPLE TEMPLATE</strong><h1>${title}</h1></header>
<p class="muted">Preview only. No employee or payroll data is included.</p>
<div class="grid">
<p>Employee<br><strong>Not connected</strong></p>
<p>Pay period<br><strong>Not published</strong></p>
<p>Salary date<br><strong>Not published</strong></p>
</div>
<p class="muted">Payroll records will be available after Accounts publishes a pay period.</p>
<button onclick="window.print()">Print or save as PDF</button>
</main>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `multiops-${kind}-template.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SalaryDocumentsPanel() {
  const organization = useActiveOrganization();
  const organizationId = organization.data?.organization.id ?? "current";
  const storedDays = Number(window.localStorage.getItem(`multiops.salarySlipRetentionDays.${organizationId}`) ?? "5");
  const retentionDays = Number.isInteger(storedDays) && storedDays > 0 ? storedDays : 5;
  const [theme, setTheme] = useState<TemplateTheme>("light");
  const dark = theme === "dark";

  return (
    <section className="mb-5 rounded-2xl border p-5 shadow-sm"
      style={{ borderColor: "var(--mo-border)", backgroundColor: "var(--mo-surface)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Payslips & invoices</h3>
          <p className="mt-1 text-sm text-slate-500">Downloadable sample templates · actual payroll documents will appear after Accounts publishes a pay period.</p>
        </div>
        <div className="flex gap-2" aria-label="Salary document template theme">
          {(["light", "dark"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={theme === value}
              onClick={() => setTheme(value)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize ${theme === value ? "border-violet-400 bg-violet-100 text-violet-900" : "border-slate-200 text-slate-600"}`}>
              {value} template
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Preview availability window: {retentionDays} day{retentionDays === 1 ? "" : "s"} after the salary date. The Admin setting is currently stored in this browser only.
      </p>

      <article className="mt-4 rounded-xl border p-5"
        style={{
          borderColor: dark ? "#374151" : "#dbe3ef",
          backgroundColor: dark ? "#111827" : "#ffffff",
          color: dark ? "#f9fafb" : "#111827",
        }}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4"
          style={{ borderColor: dark ? "#374151" : "#e2e8f0" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">MultiOps · document preview</p>
            <h4 className="mt-1 text-lg font-bold">Salary slip / invoice template</h4>
          </div>
          <span className="rounded-full border px-3 py-1 text-xs">Sample layout · no payroll data</span>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <p>Employee: <span className="opacity-70">Available after payroll connection</span></p>
          <p>Pay period: <span className="opacity-70">Not published</span></p>
          <p>Salary date: <span className="opacity-70">Not published</span></p>
        </div>
      </article>

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => downloadTemplate("salary-slip", theme)}
          className="rounded-lg border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50">
          Download sample salary slip
        </button>
        <button type="button" onClick={() => downloadTemplate("invoice", theme)}
          className="rounded-lg border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50">
          Download sample invoice
        </button>
      </div>
    </section>
  );
}
