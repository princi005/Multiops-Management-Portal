export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface GLAccount {
  id: string;
  code: string;
  name: string;
  account_type: AccountType;
  parent_account_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FinancialPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed";
  closed_at: string | null;
  created_at: string;
}

export interface JournalEntryLine {
  id: string;
  gl_account_id: string;
  department_id: string | null;
  party_id: string | null;
  debit: number;
  credit: number;
  line_description: string | null;
}

export interface JournalEntry {
  id: string;
  period_id: string;
  entry_date: string;
  reference: string | null;
  description: string;
  status: "draft" | "posted";
  created_by_id: string;
  created_at: string;
  deleted_at: string | null;
  deleted_by_id: string | null;
  lines: JournalEntryLine[];
}

export interface JournalEntryLineInput {
  gl_account_id: string;
  department_id?: string | null;
  party_id?: string | null;
  debit: number;
  credit: number;
  line_description?: string | null;
}

export interface JournalEntryCreatePayload {
  period_id: string;
  entry_date: string;
  reference?: string | null;
  description: string;
  lines: JournalEntryLineInput[];
}

export interface JournalEntryUpdatePayload {
  entry_date: string;
  reference?: string | null;
  description: string;
  lines: JournalEntryLineInput[];
  reason: string;
}

export interface JournalEntrySnapshot {
  entry_date: string;
  reference: string | null;
  description: string;
  lines: {
    gl_account_id: string;
    department_id: string | null;
    party_id: string | null;
    debit: number;
    credit: number;
    line_description: string | null;
  }[];
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  reason: string;
  previous_value: JournalEntrySnapshot | { deleted: boolean } | null;
  new_value: JournalEntrySnapshot | { deleted: boolean } | null;
  changed_by_id: string | null;
  changed_by_email: string | null;
  created_at: string;
}

export type PartyType = "customer" | "vendor";

export interface Party {
  id: string;
  party_type: PartyType;
  name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PartyCreatePayload {
  party_type: PartyType;
  name: string;
  email?: string | null;
  phone?: string | null;
  tax_id?: string | null;
  address?: string | null;
}

export interface TrialBalanceLine {
  gl_account_id: string;
  code: string;
  name: string;
  account_type: string;
  total_debit: number;
  total_credit: number;
  balance: number;
}

export interface TrialBalanceReport {
  period_id: string;
  period_name: string;
  lines: TrialBalanceLine[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}