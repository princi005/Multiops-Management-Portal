export type PayFrequency = "monthly";
export type PayrollProfileStatus = "active" | "inactive";

export interface PayrollProfile {
  id: string;
  employee_id: string;
  basic_salary: number;
  pay_frequency: PayFrequency;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  benefits: Record<string, number>;
  pan: string | null;
  bank_account_number: string | null;
  ifsc: string | null;
  status: PayrollProfileStatus;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollProfileWithEmployee extends PayrollProfile {
  employee_code: string;
  employee_designation: string | null;
}

export interface SalaryHistoryEntry {
  id: string;
  employee_id: string;
  basic_salary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  benefits: Record<string, number>;
  pan: string | null;
  bank_account_number: string | null;
  ifsc: string | null;
  effective_date: string;
  action: string;
  reason: string;
  changed_by_id: string | null;
  changed_by_email: string | null;
  created_at: string;
}

export interface PayrollProfileUpdatePayload {
  basic_salary: number;
  pay_frequency: PayFrequency;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  benefits: Record<string, number>;
  pan?: string | null;
  bank_account_number?: string | null;
  ifsc?: string | null;
  effective_date?: string | null;
  reason: string;
}