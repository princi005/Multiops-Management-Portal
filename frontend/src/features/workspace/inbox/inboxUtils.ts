export type InboxFilter =
  | "all"
  | "unread"
  | "projects"
  | "requests"
  | "comments"
  | "announcements"
  | "other";

export type InboxCategory = Exclude<InboxFilter, "all" | "unread">;

export function categoryForKind(kind: string): InboxCategory {
  const value = kind.toLocaleLowerCase();

  if (value.includes("comment") || value.includes("reply")) return "comments";
  if (value.includes("request") || value.includes("approval") || value.includes("leave")) return "requests";
  if (value.includes("announcement") || value.includes("recognition") || value.includes("post")) return "announcements";
  if (
    value.includes("project") ||
    value.includes("ticket") ||
    value.includes("task") ||
    value.includes("assignment")
  ) return "projects";

  return "other";
}

export function categoryLabel(category: InboxCategory): string {
  const labels: Record<InboxCategory, string> = {
    projects: "Project work",
    requests: "Requests",
    comments: "Comments",
    announcements: "Announcements",
    other: "Other updates",
  };
  return labels[category];
}
