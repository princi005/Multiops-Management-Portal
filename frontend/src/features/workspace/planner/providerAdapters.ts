import { CalendarDays, Mail, Server, Video } from "lucide-react";
import type { PlannerProviderAdapter } from "./types";

export const plannerProviderAdapters: PlannerProviderAdapter[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Calendar",
    description: "Open your Google Calendar.",
    href: "https://calendar.google.com/",
    icon: CalendarDays,
  },
  {
    id: "outlook-calendar",
    name: "Microsoft Outlook Calendar",
    category: "Calendar",
    description: "Open Outlook Calendar.",
    href: "https://outlook.office.com/calendar/",
    icon: CalendarDays,
  },
  {
    id: "zoho-calendar",
    name: "Zoho Calendar",
    category: "Calendar",
    description: "Open Zoho Calendar.",
    href: "https://calendar.zoho.com/",
    icon: CalendarDays,
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "Mail",
    description: "Open Gmail.",
    href: "https://mail.google.com/",
    icon: Mail,
  },
  {
    id: "outlook-mail",
    name: "Outlook Mail",
    category: "Mail",
    description: "Open Outlook Mail.",
    href: "https://outlook.office.com/mail/",
    icon: Mail,
  },
  {
    id: "zoho-mail",
    name: "Zoho Mail",
    category: "Mail",
    description: "Open Zoho Mail.",
    href: "https://mail.zoho.com/",
    icon: Mail,
  },
  {
    id: "yopmail",
    name: "Yopmail",
    category: "Mail",
    description: "Open Yopmail.",
    href: "https://yopmail.com/",
    icon: Mail,
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "Meetings",
    description: "Open Zoom meetings.",
    href: "https://zoom.us/",
    icon: Video,
  },
  {
    id: "smtp",
    name: "SMTP",
    category: "Mail delivery",
    description: "Email delivery configuration preview.",
    href: null,
    icon: Server,
  },
];

