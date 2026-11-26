export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  company_prefix: string;
  is_active: boolean;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
}

export interface OrganizationMembership {
  organization: Organization;
  role: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface OrganizationAuditEntry {
  id: string;
  actor_user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  reason: string | null;
  created_at: string;
}

export interface OrganizationConfig {
  company_prefix: string;
  departments: Array<{ name: string; enabled: boolean; [key: string]: unknown }>;
  roles: Array<{ name: string; enabled: boolean; permissions?: string[]; [key: string]: unknown }>;
  features: Record<string, boolean>;
  priorities: string[];
  inbox_retention_days: number;
  audit_retention_years: number;
  employee_id_format: string;
  legal_name_approvers: string[];
}

export interface PlatformAuditEntry {
  id: string;
  organization_id: string;
  organization_name: string;
  actor_user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  reason: string | null;
  created_at: string;
}

