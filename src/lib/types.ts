export type Role = "admin" | "teacher" | "parent" | "student";

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
export const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export type FeeStatus = "paid" | "partial" | "pending" | "overdue";

export interface Term {
  id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  color: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  section: string;
  homeroomTeacherId: string;
  room: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  gender: "Female" | "Male";
  dob: string;
  classId: string;
  rollNo: number;
  email: string;
  guardianIds: string[];
  address: string;
  joinedOn: string;
  status: "active" | "inactive";
  house: string;
}

export interface Guardian {
  id: string;
  name: string;
  email: string;
  phone: string;
  relation: "Mother" | "Father" | "Guardian";
  occupation: string;
  studentIds: string[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  subjectIds: string[];
  designation: string;
  joinedOn: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  weekday: Weekday;
  period: number;
  subjectId: string;
  teacherId: string;
  room: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  /** Derived from the class register when absent. */
  classId?: string;
  recordedBy?: string;
}

export interface Exam {
  id: string;
  name: string;
  classId: string;
  subjectId: string;
  termId: string;
  date: string;
  maxScore: number;
  weight: number;
  published: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  classId: string;
  subjectId: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  kind: "Homework" | "Project" | "Practical" | "Class test";
  createdBy: string;
  createdAt: string;
}

export interface Mark {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  examId?: string;
  assignmentId?: string;
  score: number;
  maxScore: number;
  comment?: string;
  enteredBy: string;
  updatedAt: string;
}

export interface FeeHead {
  id: string;
  studentId: string;
  termId: string;
  category: string;
  amount: number;
  dueDate: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: "Card" | "Bank transfer" | "Cash" | "UPI";
  reference: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorName: string;
  publishedAt: string;
  pinned: boolean;
  audience: { roles: Role[]; classIds: string[] };
  category: "Academic" | "Event" | "Facility" | "General";
}

export interface Message {
  id: string;
  threadId: string;
  fromUserId: string;
  body: string;
  at: string;
}

export interface Thread {
  id: string;
  subject: string;
  participantIds: string[];
  updatedAt: string;
}

export interface User {
  id: string;
  role: Role;
  name: string;
  title: string;
  personId?: string;
  guardianId?: string;
  studentIds?: string[];
  color: string;
}

export interface SchoolSettings {
  name: string;
  motto: string;
  address: string;
  phone: string;
  officeEmail: string;
  periodsPerDay: number;
  currency: string;
}

export interface Database {
  version: number;
  seededAt: string;
  settings: SchoolSettings;
  terms: Term[];
  currentTermId: string;
  subjects: Subject[];
  classes: SchoolClass[];
  students: Student[];
  guardians: Guardian[];
  teachers: Teacher[];
  timetable: TimetableSlot[];
  attendance: AttendanceRecord[];
  exams: Exam[];
  assignments: Assignment[];
  marks: Mark[];
  feeHeads: FeeHead[];
  announcements: Announcement[];
  threads: Thread[];
  messages: Message[];
  users: User[];
}

export type CollectionName = {
  [K in keyof Database]: Database[K] extends Array<infer T> ? T : never;
} & Record<string, never>;

export type Collections = {
  [K in keyof Database]: Database[K] extends Array<infer T> ? T : never;
};
