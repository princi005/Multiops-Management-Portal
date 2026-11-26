import {
  Activity,
  AppWindow,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  FolderKanban,
  Globe,
  HeartHandshake,
  Inbox,
  LifeBuoy,
  KeyRound,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserRound,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CurrentUser } from "../../hooks/useCurrentUser";

export interface PortalModule {
  id: string;
  label: string;
  group: string;
  href: string;
  description: string;
  previewItems: string[];
  icon: LucideIcon;
  connected: boolean;
}

const employeeModules: PortalModule[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    group: "My workspace",
    href: "/",
    description: "A personal overview of your work, requests, and upcoming dates.",
    previewItems: ["Task and project summary", "Upcoming meetings and reminders", "Recent company updates"],
    icon: LayoutDashboard,
    connected: true,
  },
  {
    id: "profile",
    label: "My profile",
    group: "My workspace",
    href: "/my-profile",
    description: "Your personal details, professional profile, documents, and work history.",
    previewItems: ["Personal and emergency details", "Professional profile and employee ID", "Experience, skills, courses, and certificates"],
    icon: UserRound,
    connected: true,
  },
  {
    id: "my-tickets",
    label: "My Tickets",
    group: "My workspace",
    href: "/my-projects",
    description: "Your tickets, project assignments, planner tasks, and calendar.",
    previewItems: ["Ticket board and list", "Assigned work and project tickets", "Planner tasks and calendar"],
    icon: FolderKanban,
    connected: true,
  },
  {
    id: "helpdesk",
    label: "Helpdesk",
    group: "My workspace",
    href: "/workspace/modules/helpdesk",
    description: "Raise detailed issues and review replies, status, and issue history.",
    previewItems: ["Raise a detailed issue", "Review issue status and replies", "View previous issues"],
    icon: LifeBuoy,
    connected: true,
  },
  {
    id: "planner",
    label: "Planner",
    group: "My workspace",
    href: "/workspace/modules/planner",
    description: "A unified planner for tasks, calendar events, and personal notes.",
    previewItems: ["Google, Outlook, and Zoho calendar connections", "Task list and reminders", "Private notepad"],
    icon: CalendarDays,
    connected: false,
  },
  {
    id: "teams",
    label: "Teams",
    group: "My workspace",
    href: "/workspace/modules/teams",
    description: "Department teams, managers, team leads, and reporting relationships.",
    previewItems: ["Department hierarchy", "Managers and team leads", "Team member directory"],
    icon: Users,
    connected: false,
  },
  {
    id: "projects",
    label: "My Projects",
    group: "My workspace",
    href: "/my-projects",
    description: "Your project work, tickets, comments, replies, and assignments.",
    previewItems: ["Kanban board and list view", "Ticket assignments and status", "Comments and activity history"],
    icon: FolderKanban,
    connected: true,
  },
  {
    id: "inbox",
    label: "Inbox",
    group: "My workspace",
    href: "/workspace/modules/inbox",
    description: "One place for assignments, comments, approvals, requests, and announcements.",
    previewItems: ["Project and ticket updates", "Requests and approvals", "Organization retention settings"],
    icon: Inbox,
    connected: false,
  },
  {
    id: "documents",
    label: "Docs",
    group: "My workspace",
    href: "/workspace/modules/documents",
    description: "Company policies and shared documents.",
    previewItems: ["POSH and code of conduct", "Leave, attendance, payroll, and reimbursement guidance", "IT, security, onboarding, and offboarding documents"],
    icon: FileText,
    connected: false,
  },
  {
    id: "posts",
    label: "Posts",
    group: "My workspace",
    href: "/workspace/modules/posts",
    description: "Company posts, employee interactions, and recognition.",
    previewItems: ["Company posts, likes, and comments", "Public employee recognition", "Private appreciation"],
    icon: HeartHandshake,
    connected: false,
  },
  {
    id: "meetings",
    label: "My Meetings",
    group: "My workspace",
    href: "/workspace/modules/meetings",
    description: "Your meeting calendar and connected video meetings.",
    previewItems: ["Organization calendar connection", "Upcoming meetings", "Zoom meeting links"],
    icon: Video,
    connected: false,
  },
  {
    id: "attendance",
    label: "Attendance",
    group: "My workspace",
    href: "/workspace/modules/attendance",
    description: "Shift timings, clock actions, attendance logs, and requests.",
    previewItems: ["Clock in and clock out", "Weekly shift and work-hour timeline", "Missing-punch, WFH, on-duty, and partial-day requests"],
    icon: Clock,
    connected: false,
  },
  {
    id: "salary",
    label: "Salary",
    group: "My workspace",
    href: "/workspace/modules/salary",
    description: "Personal salary details, payslips, payroll information, and requests.",
    previewItems: ["Payslips and payroll history", "Salary-related requests", "Private employee salary view"],
    icon: Wallet,
    connected: false,
  },
  {
    id: "apps",
    label: "Apps",
    group: "My workspace",
    href: "/workspace/modules/apps",
    description: "Connected email, calendar, meeting, and productivity services.",
    previewItems: ["Gmail, Outlook, Zoho Mail, and SMTP", "Google, Outlook, and Zoho Calendar", "Zoom and connected provider shortcuts"],
    icon: AppWindow,
    connected: false,
  },
  {
    id: "ai-assistant",
    label: "AI Assistant",
    group: "My workspace",
    href: "/workspace/modules/ai-assistant",
    description: "A frontend placeholder for a future company knowledge assistant.",
    previewItems: ["Company knowledge assistant placeholder", "Future model-provider settings", "No AI connection is active in this phase"],
    icon: Sparkles,
    connected: false,
  },
];

const managerModules: PortalModule[] = [
  {
    id: "manager-projects",
    label: "Manager Project Workspace",
    group: "Manager",
    href: "/workspace/manager",
    description: "Create projects, organize members, and monitor project tickets.",
    previewItems: ["Create projects and assign team leads", "Add or remove project members", "Manage tickets, approvals, and project progress"],
    icon: Briefcase,
    connected: true,
  },
  {
    id: "team-analytics",
    label: "Team Progress",
    group: "Manager",
    href: "/workspace/modules/team-analytics",
    description: "Team and project-based progress summaries.",
    previewItems: ["Project progress and deadlines", "Team workload overview", "Department and project views"],
    icon: BarChart3,
    connected: false,
  },
  {
    id: "approvals",
    label: "Leave Requests",
    group: "Manager",
    href: "/workspace/modules/approvals",
    description: "Review leave requests and view leave request history.",
    previewItems: ["Pending leave requests", "Leave decisions", "Request history"],
    icon: ClipboardList,
    connected: false,
  },
];

const hrModules: PortalModule[] = [
  {
    id: "hr-people",
    label: "HR Project Workspace",
    group: "HR",
    href: "/hr",
    description: "Employee directory and people administration.",
    previewItems: ["Employee records", "Onboarding and offboarding", "Profile and employee ID workflows"],
    icon: UserCog,
    connected: true,
  },
  {
    id: "hr-workflows",
    label: "HR Workflows & Policies",
    group: "HR",
    href: "/workspace/modules/hr-workflows",
    description: "HR requests, policy information, and employee recognition tools.",
    previewItems: ["Manager then HR leave review", "HR policies and FAQs", "Recognition and appreciation"],
    icon: BookOpen,
    connected: false,
  },
];

const accountsModules: PortalModule[] = [
  {
    id: "accounts-workspace",
    label: "Accounts Workspace",
    group: "Accounts",
    href: "/accounts",
    description: "Existing finance and accounting workspace.",
    previewItems: ["Accounting workspace", "Payroll administration", "Reimbursements and expense guidance"],
    icon: CreditCard,
    connected: true,
  },
  {
    id: "payroll-admin",
    label: "Payroll Administration",
    group: "Accounts",
    href: "/accounts?tab=payroll",
    description: "Accounts-managed payroll administration.",
    previewItems: ["Payroll details and payslip operations", "Authorized salary access", "Salary request review"],
    icon: Wallet,
    connected: false,
  },
];

const ceoModules: PortalModule[] = [
  {
    id: "ceo-overview",
    label: "Executive Overview",
    group: "Leadership",
    href: "/ceo",
    description: "Executive company overview with restricted employee information.",
    previewItems: ["Organization overview", "Department and project summaries", "Salary details remain restricted"],
    icon: ShieldCheck,
    connected: true,
  },
];

const organizationAdminModules: PortalModule[] = [
  {
    id: "organization-settings",
    label: "Company Settings",
    group: "Organization Admin",
    href: "/admin/organization",
    description: "Organization configuration, roles, permissions, and member access.",
    previewItems: ["Departments, roles, and permissions", "Features and integrations", "Employee ID prefix and retention settings"],
    icon: Settings,
    connected: true,
  },
  {
    id: "organization-people",
    label: "Employees & Visibility",
    group: "Organization Admin",
    href: "/workspace/modules/organization-people",
    description: "Organization-level employee, profile visibility, and department controls.",
    previewItems: ["Employee and department management", "Profile visibility rules", "CEO profile visibility restrictions"],
    icon: Building2,
    connected: false,
  },
  {
    id: "organization-audit",
    label: "Organization Activity",
    group: "Organization Admin",
    href: "/workspace/modules/organization-audit",
    description: "Organization audit history and configurable retention.",
    previewItems: ["Administrative and employee activity", "Audit history", "Configurable retention period"],
    icon: Activity,
    connected: false,
  },
];

const platformModules: PortalModule[] = [
  {
    id: "platform-onboarding",
    label: "Client Onboarding",
    group: "Platform Admin",
    href: "/admin/platform",
    description: "Create client organizations and assign an initial Organization Admin.",
    previewItems: ["Client onboarding", "Organization status", "Initial Organization Admin assignment"],
    icon: Building2,
    connected: true,
  },
  {
    id: "platform-domains",
    label: "Domains & Sites",
    group: "Platform Admin",
    href: "/workspace/modules/platform-domains",
    description: "Platform-level client domain and site administration.",
    previewItems: ["Client domain records", "Site status", "Domain provisioning preview"],
    icon: Globe,
    connected: false,
  },
  {
    id: "platform-subscriptions",
    label: "Subscriptions",
    group: "Platform Admin",
    href: "/workspace/modules/platform-subscriptions",
    description: "Client subscription plans and status.",
    previewItems: ["Plan and subscription status", "Subscription activity", "Billing connection preview"],
    icon: CreditCard,
    connected: false,
  },
  {
    id: "platform-activity",
    label: "Platform Activity",
    group: "Platform Admin",
    href: "/workspace/modules/platform-activity",
    description: "Platform-level organization and subscription activity.",
    previewItems: ["Organization onboarding history", "Admin membership changes", "Upgrade and subscription history"],
    icon: Activity,
    connected: false,
  },
  {
    id: "platform-operations",
    label: "Platform Operations",
    group: "Platform Admin",
    href: "/workspace/modules/platform-operations",
    description: "Frontend overview for platform operations.",
    previewItems: ["Administration overview", "Operational logs", "Future service and database controls"],
    icon: KeyRound,
    connected: false,
  },
];

export function getPortalModules(user: CurrentUser | undefined): PortalModule[] {
  if (!user) return [];
  if (user.is_platform_admin) return platformModules;

  const modules = new Map<string, PortalModule>();
  const add = (items: PortalModule[]) => items.forEach((item) => modules.set(item.id, item));

  add(employeeModules);
  if (user.roles.includes("Manager")) add(managerModules);
  if (user.roles.includes("HR")) add(hrModules);
  if (user.roles.includes("Accounts")) add(accountsModules);
  if (user.roles.includes("CEO")) add(ceoModules);
  if (user.organization_roles.includes("org_admin")) add(organizationAdminModules);
  const standardRoleNames = new Set(["Employee", "Manager", "HR", "Accounts", "CEO", "Super Admin"]);
  const customWorkspaceRoles = [...new Set(
    user.roles.map((role) => role.trim()).filter((role) => role && !standardRoleNames.has(role)),
  )];

  add(customWorkspaceRoles.map((role) => {
    const roleSlug = role.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "department";
    return {
      id: `custom-workspace-${roleSlug}`,
      label: `${role} Workspace`,
      group: role,
      href: `/workspace/modules/custom-workspace-${roleSlug}`,
      description: `Department workspace for ${role}.`,
      previewItems: ["Department overview", "Team work and requests", "Shared department resources"],
      icon: Building2,
      connected: false,
    };
  }));

  return [...modules.values()];
}

export function getPortalLabel(user: CurrentUser | undefined): string {
  if (!user) return "Workspace";
  if (user.is_platform_admin) return "Platform Admin";
  if (user.organization_roles.includes("org_admin")) return "Organization Admin";
  return user.roles[0] ?? "Employee";
}
export function getSidebarModules(user: CurrentUser | undefined): PortalModule[] {
  const hiddenIds = new Set(["planner", "projects", "salary", "ai-assistant"]);
  const order = [
    "dashboard",
    "profile",
    "inbox",
    "my-tickets",
    "manager-projects",
    "hr-people",
    "accounts-workspace",
    "ceo-overview",
    "meetings",
    "apps",
    "teams",
    "posts",
    "documents",
    "attendance",
    "helpdesk",
    "team-analytics",
    "approvals",
    "hr-workflows",
    "payroll-admin",
    "organization-settings",
    "organization-people",
    "organization-audit",
  ];

  return getPortalModules(user)
    .filter((module) => !hiddenIds.has(module.id))
    .sort((left, right) => {
      const getOrder = (module: PortalModule) => {
        const index = order.indexOf(module.id);
        if (index >= 0) return index;
        if (module.id.startsWith("custom-workspace-")) return order.indexOf("manager-projects");
        return 999;
      };
      return getOrder(left) - getOrder(right);
    });
}




