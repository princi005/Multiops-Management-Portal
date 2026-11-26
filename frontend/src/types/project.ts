export type ProjectStatus = "active" | "completed" | "on_hold" | "archived";

export const PROJECT_STATUSES: ProjectStatus[] = ["active", "on_hold", "completed", "archived"];

export interface ProjectMember {
  employee_id: string;
  added_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  version: string | null;
  technology: string | null;
  requirements_text: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  manager_id: string;
  created_at: string;
  deleted_at: string | null;
  members: ProjectMember[];
}

export interface ProjectPayload {
  name: string;
  description: string | null;
  version: string | null;
  technology: string | null;
  requirements_text: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface ProjectUpdatePayload extends Partial<ProjectPayload> {
  status?: ProjectStatus;
}

export type TicketStatus =
  | "not_started"
  | "in_progress"
  | "for_review"
  | "completed"
  | "cancelled"
  | "dropped";

export const ALL_TICKET_STATUSES: TicketStatus[] = [
  "not_started",
  "in_progress",
  "for_review",
  "completed",
  "cancelled",
  "dropped",
];

export const MEMBER_TICKET_STATUSES: TicketStatus[] = [
  "not_started",
  "in_progress",
  "for_review",
  "completed",
];

export interface Ticket {
  id: string;
  project_id: string;
  parent_ticket_id: string | null;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: string;
  progress_percent: number;
  due_date: string | null;
  approval_status: "not_requested" | "pending" | "approved" | "rejected";
  assigned_to_id: string | null;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface TicketCreatePayload {
  title: string;
  description: string | null;
  parent_ticket_id: string | null;
  assigned_to_id: string | null;
  priority?: string;
  due_date?: string | null;
}

export interface TicketUpdatePayload {
  title?: string;
  description?: string | null;
  assigned_to_id?: string | null;
  priority?: string;
  progress_percent?: number;
  due_date?: string | null;
}

export interface TicketLog {
  id: string;
  note: string;
  status_from: string | null;
  status_to: string | null;
  logged_by_id: string | null;
  created_at: string;
}

export interface DirectoryEmployee {
  id: string;
  employee_code: string;
  full_name: string | null;
  email: string;
  designation: string | null;
  department_name: string | null;
}


