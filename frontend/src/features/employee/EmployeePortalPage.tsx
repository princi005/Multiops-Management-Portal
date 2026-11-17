import { useState } from "react";
import { Link } from "react-router-dom";
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-900">{children}</div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[value] ?? "bg-slate-100 text-slate-600"}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function ProfileCard({ profile }: { profile: MyProfile }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name">{profile.full_name ?? "-"}</Field>
        <Field label="Employee code">{profile.employee_code}</Field>
        <Field label="Email">{profile.email}</Field>
        <Field label="Designation">{profile.designation ?? "-"}</Field>
        <Field label="Department">{profile.department_name ?? "-"}</Field>
        <Field label="Phone">{profile.phone ?? "-"}</Field>
        <Field label="Date of joining">{formatDate(profile.date_of_joining)}</Field>
        <Field label="Employment status"><StatusPill value={profile.employment_status} /></Field>
        <Field label="Availability"><StatusPill value={profile.availability_status} /></Field>
        <Field label="Roles">{profile.roles.join(", ") || "-"}</Field>
      </div>
      <SkillsSection skills={profile.skills} />
    </div>
  );
}

function AmountList({ title, items }: { title: string; items: Record<string, number> }) {
  const entries = Object.entries(items);
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-1 text-sm text-slate-400">None</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {entries.map(([name, amount]) => (
            <li key={name} className="flex justify-between text-sm">
              <span className="capitalize text-slate-600">{name.replace(/_/g, " ")}</span>
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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
          <Field label="Basic salary"><span className="text-lg font-semibold">{formatMoney(salary.basic_salary)}</span></Field>
          <Field label="Pay frequency"><span className="capitalize">{salary.pay_frequency.replace(/_/g, " ")}</span></Field>
          <Field label="Effective from">{formatDate(salary.effective_date)}</Field>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
          <AmountList title="Allowances" items={salary.allowances} />
          <AmountList title="Deductions" items={salary.deductions} />
          <AmountList title="Benefits" items={salary.benefits} />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <Field label="PAN">{reveal ? salary.pan ?? "-" : maskTail(salary.pan)}</Field>
          <Field label="Bank account">{reveal ? salary.bank_account_number ?? "-" : maskTail(salary.bank_account_number)}</Field>
          <Field label="IFSC">{reveal ? salary.ifsc ?? "-" : maskTail(salary.ifsc)}</Field>
        </div>
        <button type="button" onClick={() => setReveal((value) => !value)} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-sky-600">
          {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {reveal ? "Hide bank details" : "Show bank details"}
        </button>
      </div>

      {salary.history.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Effective from</th><th className="px-5 py-3">Basic salary</th><th className="px-5 py-3">Change</th></tr>
            </thead>
            <tbody>
              {salary.history.map((item) => (
                <tr key={`${item.created_at}-${item.effective_date}`} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-slate-600">{formatDate(item.effective_date)}</td>
                  <td className="px-5 py-3 text-slate-900">{formatMoney(item.basic_salary)}</td>
                  <td className="px-5 py-3 capitalize text-slate-600">{item.action.replace(/_/g, " ")}</td>
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
      <PortalHeader title="My Profile" subtitle="Personal details" email={user?.email} accent="sky" />
      <main className="mx-auto max-w-5xl space-y-10 p-8">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {user?.roles.includes("Manager") ? (
            <>
              <Link to="/my-projects" className="rounded-xl border border-violet-200 bg-white p-4 font-medium text-violet-700 hover:bg-violet-50">
                My Projects
                <span className="mt-1 block text-sm font-normal text-slate-500">Tickets assigned to you</span>
              </Link>
              <Link to="/workspace/manager" className="rounded-xl border border-violet-200 bg-white p-4 font-medium text-violet-700 hover:bg-violet-50">
                Manager Workspace
                <span className="mt-1 block text-sm font-normal text-slate-500">Create and manage projects</span>
              </Link>
            </>
          ) : user?.roles.includes("CEO") ? (
            <Link to="/workspace/ceo" className="rounded-xl border border-violet-200 bg-white p-4 font-medium text-violet-700 hover:bg-violet-50">
              CEO Workspace
            </Link>
          ) : user?.roles.includes("HR") ? (
            <Link to="/workspace/hr" className="rounded-xl border border-violet-200 bg-white p-4 font-medium text-violet-700 hover:bg-violet-50">
              HR Workspace
              <span className="mt-1 block text-sm font-normal text-slate-500">Employee onboarding and HR tools</span>
            </Link>
          ) : user?.roles.includes("Accounts") ? (
            <>
              <Link to="/my-projects" className="rounded-xl border border-violet-200 bg-white p-4 font-medium text-violet-700 hover:bg-violet-50">
                My Projects
              </Link>
              <Link to="/workspace" className="rounded-xl border border-violet-200 bg-white p-4 font-medium text-violet-700 hover:bg-violet-50">
                My Workspace
              </Link>
            </>
          ) : (
            <Link to="/my-projects" className="rounded-xl border border-sky-200 bg-white p-4 font-medium text-sky-700 hover:bg-sky-50">
              My Projects
            </Link>
          )}
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Profile</h2>
          {profile.isLoading && <LoadingState label="Loading your profile..." />}
          {profile.isError && <ErrorState message="Failed to load your profile." onRetry={() => profile.refetch()} />}
          {profile.data && <ProfileCard profile={profile.data} />}
        </section>

        <ResumeSection />
        <ChangeRequestsSection />

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">My Salary</h2>
          {salary.isLoading && <LoadingState label="Loading your salary details..." />}
          {salary.isError && <ErrorState message="Failed to load your salary details." onRetry={() => salary.refetch()} />}
          {salary.data === null && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <EmptyState icon={Wallet} title="Salary details not set up yet" description="Accounts will add your payroll profile. It will appear here once it is ready." />
            </div>
          )}
          {salary.data && <SalaryCard salary={salary.data} />}
        </section>

        <IssuesSection />
      </main>
    </div>
  );
}

