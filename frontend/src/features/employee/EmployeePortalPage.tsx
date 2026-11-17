import { useState } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useMyProfile, useMySalary } from "../../hooks/useMe";
import PortalHeader from "../../components/PortalHeader";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import ResumeSection from "./ResumeSection";
import SkillsSection from "./SkillsSection";
import ChangeRequestsSection from "./ChangeRequestsSection";
import IssuesSection from "./IssuesSection";
import type { MyProfile, MySalary } from "../../types/me";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  on_leave: "bg-amber-50 text-amber-700",
  inactive: "bg-slate-100 text-slate-600",
  terminated: "bg-red-50 text-red-700",
  available: "bg-emerald-50 text-emerald-700",
  partially_available: "bg-amber-50 text-amber-700",
  unavailable: "bg-red-50 text-red-700",
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function maskTail(value: string | null): string {
  if (!value) return "-";
  if (value.length <= 4) return value;
  return "\u2022".repeat(value.length - 4) + value.slice(-4);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</p>
      <div className="mt-1 text-sm text-slate-900">{children}</div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
        STATUS_STYLES[value] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

function ProfileCard({ profile }: { profile: MyProfile }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
        <Field label="Name">{profile.full_name ?? "-"}</Field>
        <Field label="Employee code">{profile.employee_code}</Field>
        <Field label="Email">{profile.email}</Field>
        <Field label="Designation">{profile.designation ?? "-"}</Field>
        <Field label="Department">{profile.department_name ?? "-"}</Field>
        <Field label="Phone">{profile.phone ?? "-"}</Field>
        <Field label="Date of joining">{formatDate(profile.date_of_joining)}</Field>
        <Field label="Employment status">
          <StatusPill value={profile.employment_status} />
        </Field>
        <Field label="Availability">
          <StatusPill value={profile.availability_status} />
        </Field>
        <Field label="Roles">{profile.roles.length > 0 ? profile.roles.join(", ") : "-"}</Field>
      </div>
      <SkillsSection skills={profile.skills} />
    </div>
  );
}

function AmountList({ title, items }: { title: string; items: Record<string, number> }) {
  const entries = Object.entries(items);
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-1 text-sm text-slate-400">None</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {entries.map(([name, amount]) => (
            <li key={name} className="flex justify-between text-sm">
              <span className="text-slate-600 capitalize">{name.replace(/_/g, " ")}</span>
              <span className="text-slate-900">{formatMoney(amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SalaryCard({ salary }: { salary: MySalary }) {
  const [reveal, setReveal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
          <Field label="Basic salary">
            <span className="text-lg font-semibold">{formatMoney(salary.basic_salary)}</span>
          </Field>
          <Field label="Pay frequency">
            <span className="capitalize">{salary.pay_frequency.replace(/_/g, " ")}</span>
          </Field>
          <Field label="Effective from">{formatDate(salary.effective_date)}</Field>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
          <AmountList title="Allowances" items={salary.allowances} />
          <AmountList title="Deductions" items={salary.deductions} />
          <AmountList title="Benefits" items={salary.benefits} />
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
          <Field label="PAN">{reveal ? salary.pan ?? "-" : maskTail(salary.pan)}</Field>
          <Field label="Bank account">
            {reveal ? salary.bank_account_number ?? "-" : maskTail(salary.bank_account_number)}
          </Field>
          <Field label="IFSC">{salary.ifsc ?? "-"}</Field>
        </div>
        <button
          onClick={() => setReveal((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {reveal ? "Hide bank details" : "Show bank details"}
        </button>
      </div>

      {salary.history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Effective from</th>
                <th className="px-5 py-3 font-medium">Basic salary</th>
                <th className="px-5 py-3 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {salary.history.map((h) => (
                <tr key={`${h.created_at}-${h.effective_date}`} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-slate-600">{formatDate(h.effective_date)}</td>
                  <td className="px-5 py-3 text-slate-900">{formatMoney(h.basic_salary)}</td>
                  <td className="px-5 py-3 text-slate-600 capitalize">{h.action.replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function EmployeePortalPage() {
  const { data: user } = useCurrentUser();
  const profile = useMyProfile();
  const salary = useMySalary();

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader title="My Portal" subtitle="Employee Self-Service" email={user?.email} accent="sky" />
      <main className="p-8 max-w-5xl mx-auto space-y-10">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">My Profile</h2>
          {profile.isLoading && <LoadingState label="Loading your profile..." />}
          {profile.isError && <ErrorState message="Failed to load your profile." onRetry={() => profile.refetch()} />}
          {profile.data && <ProfileCard profile={profile.data} />}
        </section>

        <ResumeSection />

        <ChangeRequestsSection />

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">My Salary</h2>
          {salary.isLoading && <LoadingState label="Loading your salary details..." />}
          {salary.isError && <ErrorState message="Failed to load your salary details." onRetry={() => salary.refetch()} />}
          {salary.data === null && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <EmptyState
                icon={Wallet}
                title="Salary details not set up yet"
                description="Accounts will add your payroll profile. It will appear here once it is ready."
              />
            </div>
          )}
          {salary.data && <SalaryCard salary={salary.data} />}
        </section>

        <IssuesSection />
      </main>
    </div>
  );
}