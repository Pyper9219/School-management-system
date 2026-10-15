import type { AttendanceStatus, FeeHead, FeeStatus } from "@/src/lib/types";

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86_400_000);
}

export function isWeekend(iso: string): boolean {
  const day = fromISODate(iso).getDay();
  return day === 0 || day === 6;
}

/** School days between two dates, inclusive, excluding weekends. */
export function schoolDays(from: string, to: string): string[] {
  const out: string[] = [];
  if (diffDays(from, to) < 0) return out;
  let cursor = from;
  while (diffDays(cursor, to) >= 0) {
    if (!isWeekend(cursor)) out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function weekdayLabel(iso: string): string {
  return WEEKDAY_NAMES[fromISODate(iso).getDay()];
}

export function shortDate(iso: string): string {
  if (!iso) return "—";
  return fromISODate(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function mediumDate(iso: string): string {
  if (!iso) return "—";
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function longDate(iso: string): string {
  if (!iso) return "—";
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return shortDate(iso.slice(0, 10));
}

export function money(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function percent(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

const LETTERS: Array<[number, string, number]> = [
  [93, "A+", 4.0],
  [85, "A", 3.75],
  [75, "B", 3.0],
  [65, "C", 2.25],
  [55, "D", 1.5],
  [40, "E", 1.0],
  [-1, "F", 0],
];

export function letterGrade(score: number, maxScore: number): { letter: string; gpa: number; pct: number } {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  for (const [floor, letter, gpa] of LETTERS) {
    if (pct >= floor || floor === -1) return { letter, gpa, pct: Math.round(pct * 10) / 10 };
  }
  return { letter: "F", gpa: 0, pct };
}

export function feePaid(head: FeeHead): number {
  return head.payments.reduce((sum, p) => sum + p.amount, 0);
}

export function feeBalance(head: FeeHead): number {
  return Math.max(0, head.amount - feePaid(head));
}

export function feeStatus(head: FeeHead, asOf: string): FeeStatus {
  const balance = feeBalance(head);
  if (balance <= 0) return "paid";
  if (diffDays(head.dueDate, asOf) > 0) return "overdue";
  if (feePaid(head) > 0) return "partial";
  return "pending";
}

export function attendanceTone(status: AttendanceStatus): string {
  switch (status) {
    case "present":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "late":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "excused":
      return "text-sky-700 bg-sky-50 border-sky-200";
    default:
      return "text-rose-700 bg-rose-50 border-rose-200";
  }
}

export function feeTone(status: FeeStatus): string {
  switch (status) {
    case "paid":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "partial":
      return "text-sky-700 bg-sky-50 border-sky-200";
    case "overdue":
      return "text-rose-700 bg-rose-50 border-rose-200";
    default:
      return "text-amber-700 bg-amber-50 border-amber-200";
  }
}
