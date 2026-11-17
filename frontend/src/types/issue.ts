export type IssueCategory = "salary" | "payslip" | "attendance" | "other";
export type IssueStatus = "open" | "in_progress" | "resolved" | "withdrawn";

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  salary: "Salary",
  payslip: "Payslip",
  attendance: "Attendance",
  other: "Other",
};

export interface Issue {
  id: string;
  category: IssueCategory;
  subject: string;
  description: string;
  status: IssueStatus;
  response: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueForAccounts extends Issue {
  employee_id: string;
  employee_code: string;
  employee_name: string | null;
  employee_email: string;
}

export interface CreateIssuePayload {
  category: IssueCategory;
  subject: string;
  description: string;
}

export interface RespondToIssuePayload {
  id: string;
  status: "in_progress" | "resolved";
  response?: string | null;
}