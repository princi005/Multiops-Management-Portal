// "general" is the free-text kind employees send from the portal. "full_name"
// and "phone" are older, structured requests (still shown in the history).
export type ChangeField = "full_name" | "phone" | "general";
export type ChangeStatus = "pending" | "approved" | "rejected" | "cancelled";

export const CHANGE_FIELD_LABELS: Record<ChangeField, string> = {
  full_name: "Name",
  phone: "Phone",
  general: "Request",
};

export interface ChangeRequest {
  id: string;
  field: ChangeField;
  old_value: string | null;
  new_value: string;
  reason: string | null;
  status: ChangeStatus;
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface ChangeRequestForHr extends ChangeRequest {
  employee_id: string;
  employee_code: string;
  employee_name: string | null;
  employee_email: string;
}

export interface SubmitChangeRequestPayload {
  field?: ChangeField;
  new_value: string;
  reason?: string | null;
}

export interface DecideChangeRequestPayload {
  id: string;
  approve: boolean;
  decision_note?: string | null;
}