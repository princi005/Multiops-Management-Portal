import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import EmployeePortalPage from "../employee/EmployeePortalPage";

// Managers are employees too: this reuses the existing employee portal (profile,
// salary, skills, resume, requests, issues) with a way back to the Manager portal.
export default function ManagerProfilePage() {
  return (
    <div>
      <div className="bg-slate-50 border-b border-slate-200 px-8 py-2">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-violet-700 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Manager portal
        </Link>
      </div>
      <EmployeePortalPage />
    </div>
  );
}