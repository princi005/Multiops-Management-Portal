export type NotificationKind =
  | "project_added"
  | "ticket_assigned"
  | "ticket_status_changed"
  | "update_requested";

export interface NotificationItem {
  id: string;
  kind: NotificationKind | string;
  title: string;
  message: string;
  related_project_id: string | null;
  related_ticket_id: string | null;
  created_at: string;
  read_at: string | null;
}
