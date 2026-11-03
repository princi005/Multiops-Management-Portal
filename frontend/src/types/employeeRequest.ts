export type RequestType = "creation" | "exit";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface EmployeeRequest {
  id: string;
  request_type: RequestType;
  status: RequestStatus;
  payload: Record<string, unknown>;
  requested_by_id: string;
  decided_by_id: string | null;
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface EmployeeRequestApproval extends EmployeeRequest {
  temporary_password: string | null;
}

export interface CreateEmployeeRequestPayload {
  request_type: RequestType;
  payload: Record<string, unknown>;
}

export interface ApproveEmployeeRequestPayload {
  id: string;
  decision_note?: string | null;
  basic_salary?: number;
  allowances?: Record<string, number>;
  deductions?: Record<string, number>;
  benefits?: Record<string, number>;
  pan?: string | null;
  bank_account_number?: string | null;
  ifsc?: string | null;
  effective_date?: string | null;
}