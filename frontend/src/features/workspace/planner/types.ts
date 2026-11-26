import type { LucideIcon } from "lucide-react";

export interface PlannerTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface PlannerEvent {
  id: string;
  date: string;
  title: string;
  time: string;
}

export type PlannerProviderCategory = "Calendar" | "Mail" | "Meetings" | "Mail delivery";

export interface PlannerProviderAdapter {
  id: string;
  name: string;
  category: PlannerProviderCategory;
  description: string;
  href: string | null;
  icon: LucideIcon;
}
