import { useMemo } from "react";
import { diffDays, feeBalance, feePaid, feeStatus, letterGrade, percent, schoolDays, today as formatToday } from "@/src/lib/format";
import { useSchool } from "@/src/lib/store";
import type {
  Announcement,
  Assignment,
  AttendanceRecord,
  AttendanceStatus,
  Database,
  Exam,
  FeeHead,
  FeeStatus,
  Guardian,
  Mark,
  Role,
  SchoolClass,
  Subject,
  Teacher,
  Thread,
  TimetableSlot,
  User,
  Weekday,
} from "@/src/lib/types";

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  /** Present + late counted as attended, as the register reports it. */
  rate: number;
}

export interface SubjectResult {
  subject: Subject;
  pct: number;
  letter: string;
  gpa: number;
  scored: number;
  possible: number;
  entries: number;
  teacherId?: string;
}

export interface FeeSummary {
  billed: number;
  paid: number;
  balance: number;
  overdue: number;
  heads: Array<{ head: FeeHead; status: FeeStatus; paid: number; balance: number }>;
}

export class SchoolIndex {
  readonly db: Database;
  readonly today: string;
  readonly studentById: Map<string, Database["students"][number]> = new Map();
  readonly classById: Map<string, SchoolClass> = new Map();
  readonly subjectById: Map<string, Subject> = new Map();
  readonly teacherById: Map<string, Teacher> = new Map();
  readonly guardianById: Map<string, Guardian> = new Map();
  readonly userById: Map<string, User> = new Map();
  readonly rosterByClass: Map<string, Database["students"]> = new Map();
  readonly attendanceByStudent: Map<string, AttendanceRecord[]> = new Map();
  readonly attendanceByClassDay: Map<string, AttendanceRecord[]> = new Map();
  readonly marksByStudent: Map<string, Mark[]> = new Map();
  readonly marksByAssessment: Map<string, Mark[]> = new Map();
  readonly examById: Map<string, Exam> = new Map();
  readonly assignmentById: Map<string, Assignment> = new Map();
  readonly timetableByClass: Map<string, TimetableSlot[]> = new Map();
  readonly feesByStudent: Map<string, FeeHead[]> = new Map();
  readonly registeredDays = new Set<string>();

  constructor(db: Database, asOf?: string) {
    this.db = db;
    this.today = asOf ?? formatToday();
    for (const s of db.students) {
      this.studentById.set(s.id, s);
      if (!this.rosterByClass.has(s.classId)) this.rosterByClass.set(s.classId, []);
      this.rosterByClass.get(s.classId)!.push(s);
    }
    for (const c of db.classes) this.classById.set(c.id, c);
    for (const s of db.subjects) this.subjectById.set(s.id, s);
    for (const t of db.teachers) this.teacherById.set(t.id, t);
    for (const g of db.guardians) this.guardianById.set(g.id, g);
    for (const u of db.users) this.userById.set(u.id, u);
    for (const a of db.attendance) {
      const bucket = this.attendanceByStudent.get(a.studentId) ?? [];
      bucket.push(a);
      this.attendanceByStudent.set(a.studentId, bucket);
      const cls = this.studentById.get(a.studentId)?.classId ?? a.classId ?? "";
      if (cls) this.registeredDays.add(a.date);
      const dayKey = `${cls}|${a.date}`;
      const dayBucket = this.attendanceByClassDay.get(dayKey) ?? [];
      dayBucket.push(a);
      this.attendanceByClassDay.set(dayKey, dayBucket);
    }
    for (const m of db.marks) {
      const byStudent = this.marksByStudent.get(m.studentId) ?? [];
      byStudent.push(m);
      this.marksByStudent.set(m.studentId, byStudent);
      const assessmentKey = m.examId ?? m.assignmentId ?? "";
      const byAssessment = this.marksByAssessment.get(assessmentKey) ?? [];
      byAssessment.push(m);
      this.marksByAssessment.set(assessmentKey, byAssessment);
    }
    for (const e of db.exams) this.examById.set(e.id, e);
    for (const a of db.assignments) this.assignmentById.set(a.id, a);
    for (const slot of db.timetable) {
      const bucket = this.timetableByClass.get(slot.classId) ?? [];
      bucket.push(slot);
      this.timetableByClass.set(slot.classId, bucket);
    }
    for (const f of db.feeHeads) {
      const bucket = this.feesByStudent.get(f.studentId) ?? [];
      bucket.push(f);
      this.feesByStudent.set(f.studentId, bucket);
    }
    for (const list of this.attendanceByStudent.values()) list.sort((a, b) => a.date.localeCompare(b.date));
    for (const list of this.rosterByClass.values()) list.sort((a, b) => a.rollNo - b.rollNo);
  }

  student(id: string) {
    return this.studentById.get(id);
  }

  className(id: string): string {
    return this.classById.get(id)?.name ?? "Unassigned";
  }

  subjectName(id: string): string {
    return this.subjectById.get(id)?.name ?? "—";
  }

  teacherName(id?: string): string {
    if (!id) return "Unassigned";
    return this.teacherById.get(id)?.name ?? "Unassigned";
  }

  guardiansOf(studentId: string): Guardian[] {
    const student = this.studentById.get(studentId);
    return (student?.guardianIds ?? []).map((gid) => this.guardianById.get(gid)).filter((g): g is Guardian => Boolean(g));
  }

  childrenOf(userId: string): Array<Database["students"][number]> {
    const user = this.userById.get(userId);
    if (!user) return [];
    if (user.role === "student" && user.personId) {
      const own = this.studentById.get(user.personId);
      return own ? [own] : [];
    }
    if (user.guardianId) {
      const guardian = this.guardianById.get(user.guardianId);
      return (guardian?.studentIds ?? []).map((id) => this.studentById.get(id)).filter((s): s is Database["students"][number] => Boolean(s));
    }
    return [];
  }

  attendanceFor(studentId: string, from?: string, to?: string): AttendanceRecord[] {
    const all = this.attendanceByStudent.get(studentId) ?? [];
    if (!from && !to) return all;
    return all.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));
  }

  attendanceSummary(studentId: string, from?: string, to?: string): AttendanceSummary {
    const records = this.attendanceFor(studentId, from, to);
    const tally: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const r of records) tally[r.status] += 1;
    const total = records.length;
    return {
      ...tally,
      total,
      rate: percent(tally.present + tally.late + tally.excused, total),
    };
  }

  registerOn(classId: string, date: string): AttendanceRecord[] {
    return this.attendanceByClassDay.get(`${classId}|${date}`) ?? [];
  }

  hasRegister(classId: string, date: string): boolean {
    return this.registerOn(classId, date).length > 0;
  }

  classAttendanceRate(classId: string, from: string, to: string): number {
    const days = schoolDays(from, to);
    let attended = 0;
    let total = 0;
    for (const date of days) {
      for (const record of this.registerOn(classId, date)) {
        total += 1;
        if (record.status !== "absent") attended += 1;
      }
    }
    return percent(attended, total);
  }

  marksFor(studentId: string): Mark[] {
    return this.marksByStudent.get(studentId) ?? [];
  }

  marksForAssessment(assessmentId: string): Mark[] {
    return this.marksByAssessment.get(assessmentId) ?? [];
  }

  /** Weighted per-subject results for one student, exam weights applied. */
  results(studentId: string): SubjectResult[] {
    const marks = this.marksFor(studentId);
    const bySubject = new Map<string, Mark[]>();
    for (const m of marks) {
      const bucket = bySubject.get(m.subjectId) ?? [];
      bucket.push(m);
      bySubject.set(m.subjectId, bucket);
    }
    const out: SubjectResult[] = [];
    for (const [subjectId, rows] of bySubject) {
      const subject = this.subjectById.get(subjectId);
      if (!subject) continue;
      let scored = 0;
      let possible = 0;
      for (const row of rows) {
        const weight = row.examId ? this.examById.get(row.examId)?.weight ?? 25 : 10;
        scored += (row.score / row.maxScore) * weight * 100;
        possible += weight * 100;
      }
      const pct = possible ? Math.round((scored / possible) * 1000) / 10 : 0;
      const { letter, gpa } = letterGrade(pct, 100);
      const slot = this.db.timetable.find((t) => t.classId === this.studentById.get(studentId)?.classId && t.subjectId === subjectId);
      out.push({ subject, pct, letter, gpa, scored: Math.round(scored / 100), possible: Math.round(possible / 100), entries: rows.length, teacherId: slot?.teacherId });
    }
    return out.sort((a, b) => a.subject.name.localeCompare(b.subject.name));
  }

  gpa(studentId: string): number {
    const rows = this.results(studentId);
    if (!rows.length) return 0;
    return Math.round((rows.reduce((sum, r) => sum + r.gpa, 0) / rows.length) * 100) / 100;
  }

  timetableForClass(classId: string): TimetableSlot[] {
    return this.timetableByClass.get(classId) ?? [];
  }

  timetableOn(classId: string, weekday: Weekday): TimetableSlot[] {
    return this.timetableForClass(classId)
      .filter((s) => s.weekday === weekday)
      .sort((a, b) => a.period - b.period);
  }

  teacherLoad(teacherId: string): { slots: TimetableSlot[]; classIds: string[]; subjectIds: string[] } {
    const slots = this.db.timetable.filter((s) => s.teacherId === teacherId);
    return {
      slots,
      classIds: [...new Set(slots.map((s) => s.classId))],
      subjectIds: [...new Set(slots.map((s) => s.subjectId))],
    };
  }

  /** Teacher double-bookings across every class at the same weekday and period. */
  timetableConflicts(): Map<string, TimetableSlot[]> {
    const groups = new Map<string, TimetableSlot[]>();
    for (const slot of this.db.timetable) {
      const key = `${slot.weekday}|${slot.period}|${slot.teacherId}`;
      const bucket = groups.get(key) ?? [];
      bucket.push(slot);
      groups.set(key, bucket);
    }
    const conflicts = new Map<string, TimetableSlot[]>();
    for (const [key, slots] of groups) if (slots.length > 1) conflicts.set(key, slots);
    return conflicts;
  }

  fees(studentId: string, asOf: string): FeeSummary {
    const heads = this.feesByStudent.get(studentId) ?? [];
    const rows = heads.map((head) => ({
      head,
      status: feeStatus(head, asOf),
      paid: feePaid(head),
      balance: feeBalance(head),
    }));
    return {
      billed: heads.reduce((sum, h) => sum + h.amount, 0),
      paid: rows.reduce((sum, r) => sum + r.paid, 0),
      balance: rows.reduce((sum, r) => sum + r.balance, 0),
      overdue: rows.filter((r) => r.status === "overdue").reduce((sum, r) => sum + r.balance, 0),
      heads: rows,
    };
  }

  upcomingExams(classId: string, asOf: string, limit = 6): Exam[] {
    return this.db.exams
      .filter((e) => e.classId === classId && e.date >= asOf)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, limit);
  }

  dueAssignments(classId: string, asOf: string): { overdue: Assignment[]; upcoming: Assignment[] } {
    const forClass = this.db.assignments.filter((a) => a.classId === classId);
    return {
      overdue: forClass.filter((a) => a.dueDate < asOf).sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
      upcoming: forClass.filter((a) => a.dueDate >= asOf).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    };
  }

  gradedRatio(assignment: Assignment): { graded: number; total: number; pending: number } {
    const roster = this.rosterByClass.get(assignment.classId) ?? [];
    const marks = this.marksForAssessment(assignment.id);
    const passed = assignment.dueDate <= this.today;
    return {
      graded: marks.length,
      total: roster.length,
      pending: passed ? Math.max(0, roster.length - marks.length) : roster.length,
    };
  }

  announcementsFor(user: User): Announcement[] {
    const studentClasses = new Set<string>();
    if (user.role === "student" && user.personId) studentClasses.add(this.studentById.get(user.personId)?.classId ?? "");
    if (user.role === "parent") for (const child of this.childrenOf(user.id)) studentClasses.add(child.classId);
    if (user.role === "teacher") for (const slot of this.db.timetable) if (slot.teacherId === user.personId) studentClasses.add(slot.classId);
    return this.db.announcements
      .filter((a) => {
        const roleOk = a.audience.roles.includes(user.role);
        const classOk = a.audience.classIds.length === 0 || [...a.audience.classIds].some((c) => studentClasses.has(c));
        return roleOk && classOk;
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt));
  }

  threadsFor(userId: string): Array<{ thread: Thread; lastMessage?: import("@/src/lib/types").Message; withUserId?: string }> {
    return this.db.threads
      .filter((t) => t.participantIds.includes(userId))
      .map((thread) => {
        const msgs = this.db.messages.filter((m) => m.threadId === thread.id).sort((a, b) => a.at.localeCompare(b.at));
        return { thread, lastMessage: msgs[msgs.length - 1], withUserId: thread.participantIds.find((p) => p !== userId) };
      })
      .sort((a, b) => (b.thread.updatedAt ?? "").localeCompare(a.thread.updatedAt ?? ""));
  }

  personName(userId: string): string {
    return this.userById.get(userId)?.name ?? "Removed account";
  }

  schoolRange(): { from: string; to: string } {
    const term = this.db.terms.find((t) => t.id === this.db.currentTermId)!;
    return { from: term.startDate, to: this.today };
  }

  /** Whole-school roll-ups used by the admin overview. */
  kpis(asOf: string) {
    const active = this.db.students.filter((s) => s.status === "active");
    const latest = this.registerOnLatestDay(asOf);
    const attendanceLatest = percent(latest.records.filter((r) => r.status !== "absent").length, latest.records.length);
    let billed = 0;
    let collected = 0;
    let overdueAmount = 0;
    let overdueHeads = 0;
    for (const s of active) {
      const summary = this.fees(s.id, asOf);
      billed += summary.billed;
      collected += summary.paid;
      overdueAmount += summary.overdue;
      overdueHeads += summary.heads.filter((h) => h.status === "overdue").length;
    }
    const atRisk = active.filter((s) => {
      const range = this.schoolRange();
      return this.attendanceSummary(s.id, range.from, range.to).rate < 90;
    });
    return {
      students: active.length,
      teachers: this.db.teachers.length,
      classes: this.db.classes.length,
      attendanceLatest,
      attendanceDay: latest.day,
      openRegisterClasses: this.openRegisterClasses(asOf).length,
      billed,
      collected,
      collectionRate: percent(collected, billed),
      overdueAmount,
      overdueHeads,
      atRisk: atRisk.length,
      upcomingExams: this.db.exams.filter((e) => e.date >= asOf && diffDays(asOf, e.date) <= 14).length,
      liveAssignments: this.db.assignments.filter((a) => a.dueDate >= asOf).length,
    };
  }

  /** Most recent day up to `asOf` that has at least one register closed. */
  latestRegisterDay(asOf: string): string | null {
    let best: string | null = null;
    for (const date of this.registeredDays) if (date <= asOf && (!best || date > best)) best = date;
    return best;
  }

  registerOnLatestDay(asOf: string): { day: string | null; records: AttendanceRecord[] } {
    const day = this.latestRegisterDay(asOf);
    if (!day) return { day: null, records: [] };
    const records: AttendanceRecord[] = [];
    for (const c of this.db.classes) records.push(...this.registerOn(c.id, day));
    return { day, records };
  }

  openRegisterClasses(asOf: string): string[] {
    if (schoolDays(asOf, asOf).length === 0) return [];
    return this.db.classes.filter((c) => !this.hasRegister(c.id, asOf)).map((c) => c.id);
  }

  attendanceTrend(days = 12): Array<{ date: string; rate: number }> {
    const term = this.db.terms.find((t) => t.id === this.db.currentTermId)!;
    const all = schoolDays(term.startDate, this.latestRegisterDay(this.today) ?? this.today);
    const window = all.slice(-days);
    return window.map((date) => {
      let attended = 0;
      let total = 0;
      for (const c of this.db.classes) {
        for (const r of this.registerOn(c.id, date)) {
          total += 1;
          if (r.status !== "absent") attended += 1;
        }
      }
      return { date, rate: percent(attended, total) };
    });
  }
}

export function useSchoolIndex(): SchoolIndex {
  const { db } = useSchool();
  return useMemo(() => new SchoolIndex(db), [db]);
}

/** Convenience hook for the subset of helpers most pages need. */
export function useSchoolData() {
  const index = useSchoolIndex();
  const { currentUser, asOf } = useSchool();
  return { index, db: index.db, currentUser, asOf };
}

export function roleHomePath(role: Role): string {
  switch (role) {
    case "admin":
      return "/overview";
    case "teacher":
      return "/my-day";
    default:
      return "/home";
  }
}
