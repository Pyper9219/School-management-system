import {
  Award,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  NotebookPen,
  School,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import type { Role } from "@/src/lib/types";

export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  group: string;
  hint?: string;
}

const ALL: Role[] = ["admin", "teacher", "parent", "student"];

export const NAV: NavItem[] = [
  { path: "/overview", label: "School overview", icon: LayoutDashboard, roles: ["admin"], group: "Leadership" },
  { path: "/my-day", label: "Today", icon: CalendarDays, roles: ["teacher"], group: "Today" },
  { path: "/home", label: "My dashboard", icon: LayoutDashboard, roles: ["parent", "student"], group: "Today" },

  { path: "/students", label: "Students", icon: Users, roles: ["admin", "teacher"], group: "People", hint: "Admissions, profiles, guardians" },
  { path: "/teachers", label: "Teaching staff", icon: School, roles: ["admin"], group: "People" },
  { path: "/classes", label: "Classes & sections", icon: BookOpen, roles: ["admin", "teacher"], group: "People" },

  { path: "/attendance", label: "Attendance register", icon: CalendarCheck, roles: ["admin", "teacher"], group: "Teaching day" },
  { path: "/timetable", label: "Timetable", icon: CalendarDays, roles: ["admin", "teacher"], group: "Teaching day" },

  { path: "/gradebook", label: "Gradebook", icon: NotebookPen, roles: ["admin", "teacher"], group: "Assessment" },
  { path: "/exams", label: "Examination schedule", icon: Award, roles: ["admin", "teacher"], group: "Assessment" },
  { path: "/assignments", label: "Assignments", icon: ClipboardList, roles: ["admin", "teacher"], group: "Assessment" },

  { path: "/fees", label: "Fees & payments", icon: Wallet, roles: ["admin"], group: "Administration" },
  { path: "/reports", label: "Reports & report cards", icon: BookOpen, roles: ["admin", "teacher"], group: "Administration" },

  { path: "/announcements", label: "Announcements", icon: Megaphone, roles: ALL, group: "Communication" },
  { path: "/messages", label: "Messages", icon: MessageSquare, roles: ALL, group: "Communication" },

  { path: "/settings", label: "School settings", icon: Settings, roles: ["admin"], group: "Communication" },
];

export function navForRole(role: Role): NavItem[] {
  return NAV.filter((item) => item.roles.includes(role));
}

export function navGroups(role: Role): Array<{ group: string; items: NavItem[] }> {
  const order: string[] = [];
  for (const item of navForRole(role)) if (!order.includes(item.group)) order.push(item.group);
  return order.map((group) => ({ group, items: navForRole(role).filter((i) => i.group === group) }));
}

export function canAccess(role: Role, path: string): boolean {
  const base = `/${path.split("/")[1] ?? ""}`;
  const item = NAV.find((n) => n.path === base);
  if (!item) return true;
  return item.roles.includes(role);
}
