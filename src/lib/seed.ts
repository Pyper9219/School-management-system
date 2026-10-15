import { addDays, schoolDays, toISODate } from "@/src/lib/format";
import type {
  Announcement,
  Assignment,
  AttendanceRecord,
  AttendanceStatus,
  Database,
  Exam,
  FeeHead,
  Guardian,
  Mark,
  Message,
  Payment,
  Role,
  SchoolClass,
  Subject,
  Term,
  Teacher,
  Thread,
  TimetableSlot,
  User,
  Weekday,
} from "@/src/lib/types";
import { WEEKDAYS } from "@/src/lib/types";

export const PERIOD_TIMES = [
  "08:30 – 09:20",
  "09:20 – 10:10",
  "10:30 – 11:20",
  "11:20 – 12:10",
  "13:00 – 13:50",
  "13:50 – 14:40",
  "14:40 – 15:30",
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Bands = Record<string, string>;

const SUBJECTS: Array<[string, string, string]> = [
  ["Mathematics", "MTH", "#2f6fed"],
  ["English Language", "ENG", "#8b5cf6"],
  ["Physics", "PHY", "#0ea5b7"],
  ["Chemistry", "CHM", "#f97316"],
  ["Biology", "BIO", "#16a34a"],
  ["History", "HIS", "#b45309"],
  ["Geography", "GEO", "#0d9488"],
  ["Computer Science", "CSC", "#4f46e5"],
  ["Art & Design", "ART", "#db2777"],
  ["Physical Education", "PE", "#65a30d"],
];

const GRADES = [6, 7, 8, 9];
const SECTIONS = ["A", "B", "C"];
const STUDENTS_PER_CLASS = 14;

const FIRST_NAMES = [
  "Amara", "Noah", "Yuki", "Isla", "Mateo", "Zara", "Kofi", "Elena", "Rohan", "Freya",
  "Idris", "Camila", "Anaya", "Theo", "Nia", "Kenji", "Lucia", "Omar", "Saoirse", "Dmitri",
  "Priya", "Jonas", "Aisha", "Milo", "Tamar", "Felix", "Leila", "Andres", "Meera", "Otto",
  "Chioma", "Rafael", "Sana", "Hugo", "Ines", "Jamal", "Nora", "Viola", "Ezra", "Anouk",
  "Bilal", "Carmen", "Dario", "Esme", "Farid", "Greta", "Hana", "Ilya", "Juno", "Kiara",
];

const LAST_NAMES = [
  "Okonkwo", "Lindqvist", "Ramirez", "Nakamura", "Achebe", "Bianchi", "Haddad", "Kowalski",
  "Ferreira", "Novak", "Castillo", "Ivanov", "Mensah", "Delacroix", "Sorensen", "Quintero",
  "Bergmann", "Adeyemi", "Rossi", "Varga", "Osei", "Marchetti", "Kaur", "Larsen", "Duarte",
  "Yamamoto", "Nieto", "Silva", "Abramov", "Chandra", "Whitfield", "Bakker", "Muller",
  "Escobar", "Ravel", "Stefanidis", "Aoki", "Cortez", "Eriksen", "Farouk",
];

const TEACHER_NAMES = [
  "Margaret Aldridge", "Grace Mbeki", "Anton Reyes", "Hanna Vogel", "Samuel Oyelaran",
  "Beatrice Low", "Nikhil Advani", "Clara Bianchi", "Tobias Lund", "Rosa Delgado",
  "Vinod Prakash", "Emel Sayar", "Julian Boyd", "Meilin Chow", "Arthur Nkemelu",
  "Pippa Hartley", "Kwame Boateng", "Sofia Marchetti", "Ivo Petrov", "Nadia Haddad",
];

const OCCUPATIONS = [
  "Civil engineer", "Nurse", "Small business owner", "Software developer", "Teacher",
  "Architect", "Pharmacist", "Logistics manager", "Journalist", "Accountant",
  "Physiotherapist", "Graphic designer", "Research scientist", "Chef",
];

const STREETS = [
  "Ashgrove Lane", "Kestrel Way", " Harbour Row", "Linden Court", "Foxglove Drive",
  "Marrow Street", "Quarry Road", "Bellhaven Close", "Alder Lane", "Sable Terrace",
];

const CITIES = ["Northgate", "Rivermouth", "Elmswood", "Kingsbury", "Fairholme"];

const HOUSES = ["Ivory", "Amber", "Sable", "Verdant"];

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, ".");
}

function bandFor(grade: number): "Middle School" | "Senior School" {
  return grade <= 7 ? "Middle School" : "Senior School";
}

/** One teacher per subject per band: middle band 0-9, senior band 10-19. */
const SUBJECT_TO_BAND_TEACHER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function teacherForSubject(rnd: () => number, bandOffset: number, subjectIndex: number): number {
  return bandOffset + SUBJECT_TO_BAND_TEACHER[subjectIndex]!;
}

interface AcademicFrame {
  startYear: number;
  terms: Term[];
  currentTermId: string;
}

function academicFrame(todayIso: string): AcademicFrame {
  const d = new Date(todayIso);
  const y = d.getFullYear();
  const startYear = d.getMonth() >= 7 ? y : y - 1;
  const next = startYear + 1;
  const terms: Term[] = [
    { id: "term-1", name: "Term 1", academicYear: `${startYear}–${next}`, startDate: `${startYear}-08-24`, endDate: `${startYear}-12-12` },
    { id: "term-2", name: "Term 2", academicYear: `${startYear}–${next}`, startDate: `${next}-01-05`, endDate: `${next}-04-03` },
    { id: "term-3", name: "Term 3", academicYear: `${startYear}–${next}`, startDate: `${next}-04-20`, endDate: `${next}-06-19` },
  ];
  let current = terms[0]!;
  for (const t of terms) if (t.startDate <= todayIso && todayIso <= t.endDate) current = t;
  if (todayIso > terms[2]!.endDate) current = terms[2]!;
  return { startYear, terms, currentTermId: current.id };
}

export function buildSeed(now = new Date()): Database {
  const rnd = mulberry32(20261015);
  const todayIso = toISODate(now);
  const frame = academicFrame(todayIso);
  const term = frame.terms.find((t) => t.id === frame.currentTermId)!;

  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]!;
  const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
  const chance = (p: number) => rnd() < p;
  const name = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

  const subjects: Subject[] = SUBJECTS.map(([n, code, color], i) => ({ id: `sub-${code.toLowerCase()}`, code, name: n, color }));

  const teachers: Teacher[] = TEACHER_NAMES.map((tName, i) => {
    const band = i < 10 ? "Middle School" : "Senior School";
    const owned = SUBJECT_TO_BAND_TEACHER.reduce<number[]>((acc, t, sIdx) => (t === i % 10 ? [...acc, sIdx] : acc), []);
    return {
      id: `tch-${`${i + 1}`.padStart(2, "0")}`,
      name: tName,
      email: `${slug(tName)}@meridiangrove.example`,
      phone: `+1 (415) 55${i % 10}-${`${10000 + i * 731}`.slice(-5)}`,
      department: band,
      subjectIds: owned.map((s) => subjects[s]!.id),
      designation: i === 0 ? "Head of Middle School" : i === 10 ? "Head of Senior School" : "Subject Teacher",
      joinedOn: `${2012 + (i % 9)}-0${(i % 8) + 1}-1${i % 9}`,
    };
  });

  const classes: SchoolClass[] = [];
  GRADES.forEach((grade, gi) => {
    SECTIONS.forEach((section, si) => {
      const bandOffset = bandFor(grade) === "Middle School" ? 0 : 10;
      const linear = gi * 3 + si;
      const homeroomSubject = SUBJECT_TO_BAND_TEACHER[linear % 10]!;
      classes.push({
        id: `cls-${grade}${section.toLowerCase()}`,
        name: `Grade ${grade} · ${section}`,
        grade,
        section,
        homeroomTeacherId: teachers[bandOffset + homeroomSubject]!.id,
        room: `${grade}${section}-1`,
      });
    });
  });

  const classIndex = new Map(classes.map((c, i) => [c.id, i]));

  // ---- timetable: 5 days x 7 periods, conflict-free by band construction
  const timetable: TimetableSlot[] = [];
  const periods = 7;
  for (const cls of classes) {
    const gi = Math.floor((classIndex.get(cls.id)! ) / 3);
    const si = classIndex.get(cls.id)! % 3;
    const bandOffset = bandFor(cls.grade) === "Middle School" ? 0 : 10;
    const bandShift = bandOffset === 0 ? 0 : 5;
    WEEKDAYS.forEach((weekday: Weekday, wIdx) => {
      for (let p = 0; p < periods; p++) {
        const n = wIdx * periods + p;
        const subjectIndex = (n + bandShift + gi * 3 + si) % 10;
        const s = subjects[subjectIndex]!;
        const room =
          s.code === "PHY" || s.code === "CHE" || s.code === "BIO"
            ? `Lab ${s.code}`
            : s.code === "PE"
              ? "Sports Hall"
              : s.code === "ART"
                ? "Studio 2"
                : s.code === "CSC"
                  ? "Digital Lab"
                  : cls.room;
        timetable.push({
          id: `slot-${cls.id}-${weekday}-${p + 1}`,
          classId: cls.id,
          weekday,
          period: p + 1,
          subjectId: s.id,
          teacherId: teachers[teacherForSubject(rnd, bandOffset, subjectIndex)]!.id,
          room,
        });
      }
    });
  }

  // ---- students, guardians
  const students: Database["students"] = [];
  const guardians: Guardian[] = [];
  const abilities = new Map<string, number>();
  const affinity = new Map<string, number>();
  let guardianSeq = 0;

  const makeGuardian = (studentName: string, relation: Guardian["relation"], surname: string): Guardian => {
    guardianSeq += 1;
    const gName = `${pick(FIRST_NAMES)} ${surname}`;
    return {
      id: `grd-${`${guardianSeq}`.padStart(3, "0")}`,
      name: gName,
      email: `${slug(gName)}${guardianSeq}@meridiangrove.example`,
      phone: `+1 (415) 55${int(0, 9)}-${`${20000 + guardianSeq * 311}`.slice(-5)}`,
      relation,
      occupation: pick(OCCUPATIONS),
      studentIds: [],
    };
  };

  const surnameOf = (fullName: string) => fullName.split(" ")[1]!;

  for (const cls of classes) {
    for (let roll = 1; roll <= STUDENTS_PER_CLASS; roll++) {
      const sName = name();
      const id = `stu-${slug(sName).slice(0, 18)}-${cls.grade}${cls.section.toLowerCase()}${roll}`;
      const age = cls.grade + 5 + (chance(0.5) ? 0 : 1);
      const guardian = makeGuardian(sName, chance(0.55) ? "Mother" : "Father", surnameOf(sName));
      guardian.studentIds.push(id);
      guardians.push(guardian);
      const guardianIds = [guardian.id];
      if (chance(0.45)) {
        const second: Guardian = {
          ...guardian,
          id: `grd-${`${(guardianSeq += 1)}`.padStart(3, "0")}`,
          name: `${pick(FIRST_NAMES)} ${surnameOf(sName)}`,
          relation: guardian.relation === "Mother" ? "Father" : "Mother",
          occupation: pick(OCCUPATIONS),
          studentIds: [id],
        };
        guardians.push(second);
        guardianIds.push(second.id);
      }
      const guardianEmail = guardian.email.split("@")[0]!;
      students.push({
        id,
        admissionNo: `MGA-${frame.startYear}${`${classIndex.get(cls.id)! * 100 + roll}`.padStart(4, "0")}`,
        name: sName,
        gender: chance(0.5) ? "Female" : "Male",
        dob: `${frame.startYear - age}-${`${int(1, 12)}`.padStart(2, "0")}-${`${int(1, 28)}`.padStart(2, "0")}`,
        classId: cls.id,
        rollNo: roll,
        email: `${guardianEmail}.student@meridiangrove.example`,
        guardianIds,
        address: `${int(2, 180)} ${pick(STREETS).trim()}, ${pick(CITIES)}`,
        joinedOn: `${frame.startYear}-08-${`${int(15, 26)}`.padStart(2, "0")}`,
        status: chance(0.985) ? "active" : "inactive",
        house: pick(HOUSES),
      });
      abilities.set(id, 0.5 + rnd() * 0.45);
      for (const s of subjects) affinity.set(`${id}|${s.id}`, rnd() * 0.3 - 0.1);
    }
  }

  // Sibling pairs share guardians so the family portal has more than one child.
  const pool = [...students].sort(() => rnd() - 0.5);
  const siblingUsers: string[] = [];
  for (let i = 0; i + 1 < pool.length && i < 12; i += 2) {
    const older = pool[i]!;
    const younger = pool[i + 1]!;
    if (older.classId === younger.classId) continue;
    younger.guardianIds = older.guardianIds;
    for (const gid of older.guardianIds) {
      const g = guardians.find((x) => x.id === gid)!;
      if (!g.studentIds.includes(younger.id)) g.studentIds.push(younger.id);
    }
    siblingUsers.push(older.guardianIds[0]!);
  }

  const rosterOf = (classId: string) => students.filter((s) => s.classId === classId);

  // ---- attendance: daily register for the most recent school days
  const attendanceDays = schoolDays(term.startDate, addDays(todayIso, -1)).slice(-32);
  const atRisk = new Set(students.filter(() => chance(0.05)).map((s) => s.id));
  const attendance: AttendanceRecord[] = [];
  let attSeq = 0;
  for (const date of attendanceDays) {
    for (const s of students) {
      if (s.status === "inactive") continue;
      const risky = atRisk.has(s.id);
      const roll = rnd();
      const status: AttendanceStatus =
        roll < (risky ? 0.22 : 0.045) ? "absent" : roll < (risky ? 0.3 : 0.075) ? "late" : roll < (risky ? 0.33 : 0.088) ? "excused" : "present";
      attSeq += 1;
      attendance.push({
        id: `att-${attSeq}`,
        studentId: s.id,
        date,
        status,
        ...(status === "excused" ? { note: pick(["Medical appointment", "Family leave", "Competition"]) } : {}),
      });
    }
  }

  // ---- exams, assignments and marks
  const unitWeekStart = addDays(term.startDate, 24);
  const midtermStart = addDays(todayIso, 9);
  const exams: Exam[] = [];
  const assignments: Assignment[] = [];
  const marks: Mark[] = [];

  for (const cls of classes) {
    const roster = rosterOf(cls.id);
    for (let si = 0; si < subjects.length; si++) {
      const subject = subjects[si]!;
      const teacherId = teachers[teacherForSubject(rnd, bandFor(cls.grade) === "Middle School" ? 0 : 10, si)]!.id;
      const unitId = `exm-${cls.id}-${subject.code}-unit`;
      exams.push({
        id: unitId,
        name: "Unit Test 1",
        classId: cls.id,
        subjectId: subject.id,
        termId: term.id,
        date: addDays(unitWeekStart, si),
        maxScore: 40,
        weight: 30,
        published: true,
      });
      exams.push({
        id: `exm-${cls.id}-${subject.code}-mid`,
        name: "Midterm Examination",
        classId: cls.id,
        subjectId: subject.id,
        termId: term.id,
        date: addDays(midtermStart, si),
        maxScore: 80,
        weight: 45,
        published: false,
      });
      for (const s of roster) {
        const base = abilities.get(s.id)!;
        const pct = Math.min(0.995, Math.max(0.3, base + affinity.get(`${s.id}|${subject.id}`)! + (rnd() * 0.1 - 0.05)));
        marks.push({
          id: `mrk-${unitId}-${s.id}`,
          studentId: s.id,
          subjectId: subject.id,
          classId: cls.id,
          examId: unitId,
          score: Math.round(pct * 40),
          maxScore: 40,
          enteredBy: teacherId,
          updatedAt: `${addDays(unitWeekStart, si)}T10:00:00Z`,
        });
      }
    }

    for (let a = 0; a < 6; a++) {
      const subjectIndex = (a * 3 + 1) % subjects.length;
      const subject = subjects[subjectIndex]!;
      const teacherId = teachers[teacherForSubject(rnd, bandFor(cls.grade) === "Middle School" ? 0 : 10, subjectIndex)]!.id;
      const kind = pick(["Homework", "Project", "Practical", "Class test"] as const);
      const dueOffset = [-24, -17, -9, -3, 2, 6, 12, 18][a % 8]!;
      const dueDate = addDays(todayIso, dueOffset);
      const created = a === 0
        ? `2026-10-01T09:00:00Z`
        : `${addDays(dueDate, -7)}T09:00:00Z`;
      const id = `asg-${cls.id}-${a + 1}`;
      const maxScore = kind === "Project" ? 50 : kind === "Class test" ? 25 : 20;
      assignments.push({
        id,
        title: pick([
          "Problem set", "Reading response", "Field report", "Lab write-up", "Essay draft",
          "Portfolio piece", "Revision worksheet", "Group presentation", "Source analysis",
        ]) + ` — ${subject.name.split(" ")[0]}`,
        classId: cls.id,
        subjectId: subject.id,
        instructions: `Complete the ${subject.name.toLowerCase()} task and submit before the end of day. Show all working and reference any external sources.`,
        dueDate,
        maxScore,
        kind,
        createdBy: teacherId,
        createdAt: created,
      });
      if (dueDate <= todayIso && chance(0.8)) {
        for (const s of roster) {
          if (chance(0.08)) continue;
          const base = abilities.get(s.id)!;
          const pct = Math.min(1, Math.max(0.25, base + affinity.get(`${s.id}|${subject.id}`)! + (rnd() * 0.12 - 0.06)));
          marks.push({
            id: `mrk-${id}-${s.id}`,
            studentId: s.id,
            subjectId: subject.id,
            classId: cls.id,
            assignmentId: id,
            score: Math.round(pct * maxScore),
            maxScore,
            comment: chance(0.2) ? pick(["Neat and well structured.", "Show your working next time.", "Strong improvement.", "See me after class."]) : undefined,
            enteredBy: teacherId,
            updatedAt: `${addDays(dueDate, 2)}T14:00:00Z`,
          });
        }
      }
    }
  }

  // ---- fees
  const feeHeads: FeeHead[] = [];
  let feeSeq = 0;
  const termTuition = 1_450;
  for (const s of students) {
    const cls = classes.find((c) => c.id === s.classId)!;
    const heads = [
      { category: "Tuition", amount: termTuition + cls.grade * 40, dueOffset: -6 },
      { category: "Exams & materials", amount: 220, dueOffset: 4 },
      ...(chance(0.5) ? [{ category: "Activities levy", amount: 150, dueOffset: 11 }] : []),
    ];
    for (const h of heads) {
      feeSeq += 1;
      const dueDate = addDays(todayIso, h.dueOffset);
      const roll = rnd();
      const payments: Payment[] = [];
      if (s.status === "inactive") {
        // inactive students keep a settled history
        payments.push({ id: `pay-${feeSeq}`, amount: h.amount, date: addDays(dueDate, -9), method: "Bank transfer", reference: `MGA${1000 + feeSeq}` });
      } else if (roll < 0.72) {
        payments.push({ id: `pay-${feeSeq}`, amount: h.amount, date: addDays(dueDate, -int(1, 12)), method: pick(["Card", "Bank transfer", "UPI"]), reference: `MGA${1000 + feeSeq}` });
      } else if (roll < 0.86) {
        payments.push({ id: `pay-${feeSeq}`, amount: Math.round(h.amount * 0.4), date: addDays(dueDate, -int(1, 6)), method: "Card", reference: `MGA${1000 + feeSeq}` });
      }
      feeHeads.push({
        id: `fee-${feeSeq}`,
        studentId: s.id,
        termId: term.id,
        category: h.category,
        amount: h.amount,
        dueDate,
        payments,
      });
    }
  }

  // ---- announcements
  const ANNOUNCEMENTS: Array<[string, string, string, Announcement["category"], boolean]> = [
    ["Midterm examinations begin next week", "The Grade 6–9 midterm timetable is now published in each class register. Candidates should arrive fifteen minutes before their paper and bring a scientific calculator for Mathematics and Physics.", "Margaret Aldridge", "Academic", true],
    ["Parent–teacher conferences", "Booking opens Monday for two fifteen-minute slots per family. Teachers will confirm availability the same day; late requests go to the front desk.", "Daniel Ferris", "Event", true],
    ["Library extended hours during revision", "The library stays open until 18:00 from Monday to Thursday for the next three weeks. Quiet study rooms can be reserved at the desk.", "Grace Mbeki", "Facility", false],
    ["Autour concert — tickets for families", "The senior choir and orchestra perform Friday at 19:00 in the hall. Two seats per family; collect from the office with your admission number.", "Rosa Delgado", "Event", false],
    ["Sports day venue change", "Field events move to the Rivermouth astro pitch because of resurfacing. Buses leave at 08:15; bring water bottles and sunscreen.", "Tobias Lund", "Event", false],
    ["Attendance below 90% this month", "Twelve students dropped under the 90% attendance threshold in Term 1. Form teachers will call home today to agree a support plan.", "Margaret Aldridge", "Academic", false],
    ["New uniform supplier", "Kit is now made by Linden Court Tailors. Existing uniform remains acceptable; replacements are ordered online and delivered to school.", "Daniel Ferris", "General", false],
    ["Science fair submissions", "Project abstracts are due in nine days. Each class nominates two entries; judging panels need a volunteer parent by Friday.", "Vinod Prakash", "Academic", false],
    ["Early dismissal on Friday", "Whole school leaves at 12:30 for staff development. After-school clubs do not run; transport makes one extra trip at 12:45.", "Margaret Aldridge", "General", false],
    ["Counselling drop-in hours", "The counsellor's office is open for students between 13:00 and 15:00 on weekdays. Appointments are confidential.", "Emel Sayar", "General", false],
    ["Dental screening results", "Sixty-two screenings were completed. Families of children needing follow-up care have been emailed a referral letter.", "Beatrice Low", "Facility", false],
    ["Winter term fee reminder", "The Activities levy falls due within the next two weeks. Payment plans are available — speak to the bursar before the due date.", "Daniel Ferris", "General", false],
  ];

  const announcements: Announcement[] = ANNOUNCEMENTS.map(([title, body, author, category, pinned], i) => ({
    id: `ann-${i + 1}`,
    title,
    body,
    authorName: author,
    publishedAt: `${addDays(todayIso, -(i * 2 + 1))}T${`${7 + (i % 6)}`.padStart(2, "0")}:30:00Z`,
    pinned,
    category,
    audience:
      i % 4 === 0
        ? { roles: ["admin", "teacher", "parent", "student"] as Role[], classIds: [] }
        : i % 4 === 1
          ? { roles: ["parent", "student"] as Role[], classIds: [] }
          : i % 4 === 2
            ? { roles: ["admin", "teacher"] as Role[], classIds: [] }
            : { roles: ["teacher"] as Role[], classIds: classes.slice(0, 6).map((c) => c.id) },
  }));

  // ---- messaging
  const threads: Thread[] = [];
  const messages: Message[] = [];
  const teacherUserIds = teachers.slice(0, 8).map((t) => `usr-tch-${t.id}`);
  const guardianSample = guardians.filter((g) => g.studentIds.length > 0).slice(0, 10);
  const CONVERSATIONS: Array<[string, string[]]> = [
    ["Progress update for my child", ["Midterm results are looking steady. She is contributing well in class discussions.", "Thank you — she mentions enjoying the group project. Does she hand work in on time?"]],
    ["Absence on Tuesday", ["Sorry for the short notice — he had a fever and slept most of the day.", "Noted and marked excused. Please send a note when he is back."]],
    ["Request to change lab group", ["I would like to move groups if possible. My current team meets at a difficult time.", "That is fine as long as it happens before the submission date. I will update the roster."]],
    ["Fee payment plan", ["Could we split the tuition over two instalments?", "Yes — the bursar can set up two dates. Please confirm the second one before Friday."]],
    ["Conference slot", ["Could we take the 15:20 slot on Wednesday?", "Booked. I will have his report card ready to walk through."]],
  ];
  CONVERSATIONS.forEach(([subject, bodies], i) => {
    const teacher = teacherUserIds[i % teacherUserIds.length]!;
    const parent = `usr-par-${guardianSample[i]!.id}`;
    const threadId = `thr-${i + 1}`;
    let cursor = addDays(todayIso, -(i + 1) * 3);
    const ids: string[] = [];
    bodies.forEach((body, j) => {
      const id = `msg-${threadId}-${j}`;
      ids.push(id);
      messages.push({ id, threadId, fromUserId: j % 2 === 0 ? parent : teacher, body, at: `${cursor}T${`${10 + j}`.padStart(2, "0")}:15:00Z` });
      cursor = addDays(cursor, 1);
    });
    threads.push({ id: threadId, subject, participantIds: [teacher, parent], updatedAt: `${cursor}T12:00:00Z` });
  });

  // ---- login accounts
  const users: User[] = [
    { id: "usr-admin-1", role: "admin", name: "Margaret Aldridge", title: "Principal", color: "#1d3f63" },
    { id: "usr-admin-2", role: "admin", name: "Daniel Ferris", title: "Registrar & Bursar", color: "#7a5a19" },
  ];
  teachers.slice(0, 4).forEach((t) => {
    users.push({ id: `usr-tch-${t.id}`, role: "teacher", name: t.name, title: `${t.department} · ${t.subjectIds.length} subject${t.subjectIds.length > 1 ? "s" : ""}`, personId: t.id, color: "#2f6fed" });
  });
  const parentGuardians = [...new Set(siblingUsers.concat(guardians.slice(0, 2).map((g) => g.id)))].slice(0, 3);
  parentGuardians.forEach((gid) => {
    const g = guardians.find((x) => x.id === gid)!;
    users.push({ id: `usr-par-${g.id}`, role: "parent", name: g.name, title: `Parent of ${g.studentIds.length} child${g.studentIds.length > 1 ? "ren" : ""}`, guardianId: g.id, studentIds: g.studentIds, color: "#0d9488" });
  });
  const studentSample = students.filter((s) => s.status === "active").slice(40, 42);
  studentSample.forEach((s) => {
    users.push({ id: `usr-stu-${s.id}`, role: "student", name: s.name, title: classes.find((c) => c.id === s.classId)!.name, personId: s.id, studentIds: [s.id], color: "#8b5cf6" });
  });

  return {
    version: 2,
    seededAt: new Date().toISOString(),
    settings: {
      name: "Meridian Grove Academy",
      motto: "Learn deeply. Lead kindly.",
      address: "48 Ashgrove Lane, Northgate",
      phone: "+1 (415) 555-0110",
      officeEmail: "office@meridiangrove.example",
      periodsPerDay: 7,
      currency: "USD",
    },
    terms: frame.terms,
    currentTermId: frame.currentTermId,
    subjects,
    classes,
    students,
    guardians,
    teachers,
    timetable,
    attendance,
    exams,
    assignments,
    marks,
    feeHeads,
    announcements,
    threads,
    messages,
    users,
  };
}
