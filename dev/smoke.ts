import { buildSeed } from "@/src/lib/seed";
import { SchoolIndex } from "@/src/lib/selectors";
import { today } from "@/src/lib/format";

const db = buildSeed();
const asOf = today();
const index = new SchoolIndex(db, asOf);
const kpis = index.kpis(asOf);

const sample = db.students[0]!;
const results = index.results(sample.id);
const fees = index.fees(sample.id, asOf);

const report = {
  asOf,
  term: db.terms.find((t) => t.id === db.currentTermId)?.name,
  counts: {
    students: db.students.length,
    teachers: db.teachers.length,
    classes: db.classes.length,
    guardians: db.guardians.length,
    timetable: db.timetable.length,
    attendance: db.attendance.length,
    exams: db.exams.length,
    assignments: db.assignments.length,
    marks: db.marks.length,
    feeHeads: db.feeHeads.length,
    users: db.users.length,
    threads: db.threads.length,
  },
  jsonBytes: JSON.stringify(db).length,
  kpis: { ...kpis, billed: Math.round(kpis.billed), collected: Math.round(kpis.collected), overdueAmount: Math.round(kpis.overdueAmount) },
  conflicts: index.timetableConflicts().size,
  registerDay: kpis.attendanceDay,
  sampleStudent: { name: sample.name, attendance: index.attendanceSummary(sample.id), subjects: results.length, firstResult: results[0], gpa: index.gpa(sample.id), feeBalance: fees.balance },
  parentUser: db.users.find((u) => u.role === "parent")?.name,
  parentChildren: index.childrenOf(db.users.find((u) => u.role === "parent")!.id).map((c) => c.name),
  adminVisibleAnnouncements: index.announcementsFor(db.users.find((u) => u.role === "admin")!).length,
};

console.log(JSON.stringify(report, null, 2));
