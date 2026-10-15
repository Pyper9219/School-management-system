import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog, AvatarCircle, Bar as MiniBar, DataTable, FilterSelect, FormRow, FieldGrid, KeyValue, PageHeader, Panel, Pill, SearchField, StatCard, type Column, type Tone } from "@/src/components/kit";
import { feeTone, attendanceTone, letterGrade, longDate, money, percent, shortDate } from "@/src/lib/format";
import { Link, useRoute } from "@/src/lib/router";
import { useSchool } from "@/src/lib/store";
import { useSchoolIndex } from "@/src/lib/selectors";
import type { Guardian, Student } from "@/src/lib/types";

function statusTone(rate: number): Tone {
  if (rate >= 95) return "good";
  if (rate >= 90) return "info";
  if (rate >= 80) return "warn";
  return "bad";
}

export function StudentsPage() {
  const { db, asOf, upsert, removeById } = useSchool();
  const index = useSchoolIndex();
  const route = useRoute();
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState(route.query.get("class") ?? "all");
  const [status, setStatus] = useState("active");
  const [editing, setEditing] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return db.students
      .filter((s) => (status === "all" ? true : s.status === status) && (classId === "all" ? true : s.classId === classId))
      .filter((s) => !needle || s.name.toLowerCase().includes(needle) || s.admissionNo.toLowerCase().includes(needle) || index.className(s.classId).toLowerCase().includes(needle));
  }, [db.students, query, classId, status, index]);

  const columns: Column<Student>[] = [
    {
      key: "name",
      header: "Student",
      sortValue: (s) => s.name,
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <AvatarCircle name={s.name} size={30} color="#1d3f63" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{s.name}</p>
            <p className="nums text-xs text-muted-foreground">{s.admissionNo}</p>
          </div>
        </div>
      ),
    },
    { key: "class", header: "Class", sortValue: (s) => index.className(s.classId), cell: (s) => <span className="text-sm">{index.className(s.classId)}</span> },
    { key: "roll", header: "Roll", align: "center", sortValue: (s) => s.rollNo, cell: (s) => <span className="nums text-sm">{s.rollNo}</span>, hideOnMobile: true },
    { key: "house", header: "House", hideOnMobile: true, sortValue: (s) => s.house, cell: (s) => <Pill tone="neutral">{s.house}</Pill> },
    {
      key: "attendance",
      header: "Attendance",
      hideOnMobile: true,
      sortValue: (s) => index.attendanceSummary(s.id, index.schoolRange().from, asOf).rate,
      cell: (s) => {
        const summary = index.attendanceSummary(s.id, index.schoolRange().from, asOf);
        return (
          <div className="w-24">
            <div className="flex items-baseline justify-between">
              <span className="nums text-sm font-medium">{summary.rate}%</span>
              {summary.absent ? <span className="nums text-[11px] text-muted-foreground">{summary.absent} abs</span> : null}
            </div>
            <MiniBar value={summary.rate} tone={statusTone(summary.rate)} className="mt-1" />
          </div>
        );
      },
    },
    {
      key: "fees",
      header: "Fees",
      hideOnMobile: true,
      sortValue: (s) => index.fees(s.id, asOf).balance,
      cell: (s) => {
        const fees = index.fees(s.id, asOf);
        const worst = fees.heads.some((h) => h.status === "overdue") ? "overdue" : fees.balance > 0 ? "partial" : "paid";
        return <Pill tone={feeTone(worst).includes("rose") ? "bad" : worst === "paid" ? "good" : "warn"}>{worst === "paid" ? "Settled" : money(fees.balance, db.settings.currency)}</Pill>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (s) => (
        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          <Button size="icon-xs" variant="ghost" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" aria-label={`Remove ${s.name}`} onClick={() => setConfirmDelete(s)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const activeCount = db.students.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        description={`${activeCount} on roll · ${db.students.length - activeCount} archived`}
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <UserPlus className="size-4" /> Enrol student
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={query} onChange={setQuery} placeholder="Name or admission number" className="w-full sm:w-72" />
        <FilterSelect label="Class" value={classId} onChange={setClassId} options={db.classes.map((c) => ({ value: c.id, label: c.name }))} />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          width="min-w-32"
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Archived" },
            { value: "all", label: "Both" },
          ]}
        />
        <span className="nums ml-auto text-xs text-muted-foreground">{rows.length} shown</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        onRowClick={(s) => route.navigate(`/students/${s.id}`)}
        emptyTitle="No students match those filters"
        emptyDescription="Clear the search or pick another class."
      />

      {creating || editing ? (
        <StudentForm
          student={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(next) => {
            upsert("students", next);
            setCreating(false);
            setEditing(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => (open ? null : setConfirmDelete(null))}
        title={`Remove ${confirmDelete?.name ?? ""}?`}
        description="This deletes the student from the roll. Attendance, marks and fee records stay in the database but the profile is no longer reachable."
        confirmLabel="Remove student"
        onConfirm={() => confirmDelete && removeById("students", confirmDelete.id)}
      />
    </div>
  );
}

function StudentForm({ student, onClose, onSave }: { student: Student | null; onClose: () => void; onSave: (student: Student) => void }) {
  const { db } = useSchool();
  const [draft, setDraft] = useState<Student>(
    student ?? {
      id: `stu-${crypto.randomUUID().slice(0, 8)}`,
      admissionNo: `MGA-${new Date().getFullYear()}${`${db.students.length + 1}`.padStart(4, "0")}`,
      name: "",
      gender: "Female",
      dob: "",
      classId: db.classes[0]?.id ?? "",
      rollNo: db.students.filter((s) => s.classId === db.classes[0]?.id).length + 1,
      email: "",
      guardianIds: [],
      address: "",
      joinedOn: new Date().toISOString().slice(0, 10),
      status: "active",
      house: "Ivory",
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof Student>(key: K, value: Student[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const next: Record<string, string> = {};
    if (draft.name.trim().length < 3) next.name = "Enter the student's full name.";
    if (!draft.classId) next.classId = "Choose a class.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.dob)) next.dob = "Date of birth must be YYYY-MM-DD.";
    if (!/^\d{3,10}$/.test(String(draft.rollNo))) next.rollNo = "Roll number must be a whole number.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({ ...draft, name: draft.name.trim(), address: draft.address.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end overflow-y-auto bg-black/45 p-0 sm:place-items-center sm:p-6" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-t-xl border border-border bg-card p-5 shadow-lg sm:rounded-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">{student ? `Edit ${student.name}` : "Enrol a student"}</h2>
            <p className="text-xs text-muted-foreground">Admission number {draft.admissionNo}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <Separator className="my-4" />
        <FieldGrid>
          <FormRow label="Full name" htmlFor="stu-name" hint={errors.name}>
            <Input id="stu-name" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Amara Okonkwo" />
          </FormRow>
          <FormRow label="Admission number" htmlFor="stu-adm">
            <Input id="stu-adm" value={draft.admissionNo} onChange={(e) => set("admissionNo", e.target.value)} />
          </FormRow>
          <FormRow label="Class" htmlFor="stu-class" hint={errors.classId}>
            <Select value={draft.classId} onValueChange={(v) => set("classId", v)}>
              <SelectTrigger id="stu-class" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-64">
                {db.classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="Roll number" htmlFor="stu-roll" hint={errors.rollNo}>
            <Input id="stu-roll" type="number" min={1} value={draft.rollNo} onChange={(e) => set("rollNo", Number(e.target.value))} />
          </FormRow>
          <FormRow label="Date of birth" htmlFor="stu-dob" hint={errors.dob ?? "Format YYYY-MM-DD."}>
            <Input id="stu-dob" value={draft.dob} onChange={(e) => set("dob", e.target.value)} placeholder="2012-04-19" />
          </FormRow>
          <FormRow label="Gender" htmlFor="stu-gender">
            <Select value={draft.gender} onValueChange={(v) => set("gender", v as Student["gender"])}>
              <SelectTrigger id="stu-gender" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="House" htmlFor="stu-house">
            <Select value={draft.house} onValueChange={(v) => set("house", v)}>
              <SelectTrigger id="stu-house" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Ivory", "Amber", "Sable", "Verdant"].map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="Email" htmlFor="stu-email">
            <Input id="stu-email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} placeholder="student@example.com" />
          </FormRow>
          <FormRow label="Home address" htmlFor="stu-address" className="sm:col-span-2">
            <Textarea id="stu-address" rows={2} value={draft.address} onChange={(e) => set("address", e.target.value)} />
          </FormRow>
        </FieldGrid>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">On roll</p>
            <p className="text-xs text-muted-foreground">Turn off to archive without deleting records.</p>
          </div>
          <Switch checked={draft.status === "active"} onCheckedChange={(checked) => set("status", checked ? "active" : "inactive")} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{student ? "Save changes" : "Add to roll"}</Button>
        </div>
      </div>
    </div>
  );
}

export function StudentDetailPage() {
  const { db, asOf, upsert } = useSchool();
  const index = useSchoolIndex();
  const route = useRoute();
  const studentId = route.segments[1];
  const student = index.student(studentId ?? "");
  const [editing, setEditing] = useState(false);
  const [guardianDraft, setGuardianDraft] = useState<Guardian | null>(null);

  if (!student) {
    return (
      <div className="space-y-4">
        <PageHeader title="Student not found" description="That profile may have been removed from the roll." />
        <Button asChild variant="outline" size="sm">
          <Link to="/students">Back to students</Link>
        </Button>
      </div>
    );
  }

  const cls = index.classById.get(student.classId);
  const range = index.schoolRange();
  const attendance = index.attendanceSummary(student.id, range.from, asOf);
  const results = index.results(student.id);
  const fees = index.fees(student.id, asOf);
  const records = index.attendanceFor(student.id, range.from, asOf).slice(-20).reverse();
  const guardians = index.guardiansOf(student.id);
  const week = index.timetableOn(student.classId, "Mon");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AvatarCircle name={student.name} size={52} color="#1d3f63" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl leading-tight font-semibold">{student.name}</h1>
              {student.status === "inactive" ? <Pill tone="neutral">Archived</Pill> : <Pill tone="good">On roll</Pill>}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {cls?.name} · Roll {student.rollNo} · {student.admissionNo} · House {student.house}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> Edit profile
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/reports?student=${student.id}`}>Report card</Link>
          </Button>
          <Button size="sm" onClick={() => setGuardianDraft({ id: `grd-${crypto.randomUUID().slice(0, 8)}`, name: "", email: "", phone: "", relation: "Mother", occupation: "", studentIds: [student.id] })}>
            <Plus className="size-4" /> Link guardian
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance this term" value={`${attendance.rate}%`} tone={statusTone(attendance.rate)} hint={`${attendance.present} present · ${attendance.late} late · ${attendance.absent} absent`} />
        <StatCard label="Average grade" value={results.length ? `${Math.round((results.reduce((s, r) => s + r.pct, 0) / results.length) * 10) / 10}%` : "—"} hint={results.length ? `${index.gpa(student.id)} GPA across ${results.length} subjects` : "No marks recorded yet"} />
        <StatCard label="Fee balance" value={money(fees.balance, db.settings.currency)} tone={fees.overdue ? "bad" : fees.balance ? "warn" : "good"} hint={`${percent(fees.paid, fees.billed)}% of ${money(fees.billed, db.settings.currency)} settled`} />
        <StatCard label="Guardians" value={guardians.length} hint={guardians.map((g) => g.relation).join(" · ") || "None linked"} />
      </div>

      <Tabs defaultValue="profile">
        <TabsList variant="line">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-3">
          <div className="grid gap-3 lg:grid-cols-3">
            <Panel title="Registration" className="lg:col-span-2">
              <KeyValue
                className="sm:grid-cols-2"
                items={[
                  ["Admission number", <span className="nums">{student.admissionNo}</span>],
                  ["Date of birth", `${longDate(student.dob)}`],
                  ["Gender", student.gender],
                  ["House", student.house],
                  ["Enrolled on", shortDate(student.joinedOn)],
                  ["Email", student.email || "—"],
                  ["Home address", student.address],
                  ["Class teacher", index.teacherName(cls?.homeroomTeacherId)],
                ]}
              />
            </Panel>
            <Panel title="Family" description="Guardian accounts">
              {guardians.length ? (
                <ul className="space-y-3">
                  {guardians.map((g) => (
                    <li key={g.id} className="flex items-start gap-2.5">
                      <AvatarCircle name={g.name} size={30} color="#0d9488" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.relation} · {g.occupation}</p>
                        <p className="truncate text-[11px] text-muted-foreground/80">{g.email}</p>
                        <p className="nums text-[11px] text-muted-foreground/80">{g.phone}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No guardian is linked to this student.</p>
              )}
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="pt-3">
          <Panel title="Term register" description={`${range.from} to ${asOf}`}>
            <div className="mb-3 grid gap-3 sm:grid-cols-4">
              {(["present", "late", "excused", "absent"] as const).map((key) => (
                <div key={key} className={`rounded-md border px-3 py-2 ${attendanceTone(key)}`}>
                  <p className="text-[11px] font-semibold tracking-wide uppercase">{key}</p>
                  <p className="nums text-lg font-semibold">{attendance[key]}</p>
                </div>
              ))}
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                  <tr>
                    <th className="py-1.5 text-left font-medium">Date</th>
                    <th className="py-1.5 text-left font-medium">Day</th>
                    <th className="py-1.5 text-left font-medium">Status</th>
                    <th className="py-1.5 text-left font-medium">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="nums py-2">{shortDate(record.date)}</td>
                      <td className="py-2 text-muted-foreground">{longDate(record.date).split(",")[0]}</td>
                      <td className="py-2">
                        <Pill tone={record.status === "present" ? "good" : record.status === "late" ? "warn" : record.status === "excused" ? "info" : "bad"}>{record.status}</Pill>
                      </td>
                      <td className="py-2 text-muted-foreground">{record.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="results" className="pt-3">
          <Panel title="Subject results" description="Weighted from published tests and graded assignments">
            {results.length ? (
              <DataTable
                pageSize={12}
                rowKey={(row) => row.subject.id}
                rows={results}
                columns={[
                  { key: "subject", header: "Subject", sortValue: (r) => r.subject.name, cell: (r) => <span className="text-sm font-medium">{r.subject.name}</span> },
                  { key: "entries", header: "Assessments", align: "center", hideOnMobile: true, cell: (r) => <span className="nums text-sm">{r.entries}</span> },
                  {
                    key: "pct",
                    header: "Score",
                    sortValue: (r) => r.pct,
                    cell: (r) => (
                      <div className="w-28">
                        <span className="nums text-sm font-medium">{r.pct}%</span>
                        <MiniBar value={r.pct} tone={r.pct >= 85 ? "good" : r.pct >= 65 ? "info" : r.pct >= 50 ? "warn" : "bad"} className="mt-1" />
                      </div>
                    ),
                  },
                  { key: "letter", header: "Grade", align: "center", sortValue: (r) => r.pct, cell: (r) => <Pill tone={r.pct >= 85 ? "good" : r.pct >= 65 ? "info" : r.pct >= 50 ? "warn" : "bad"}>{r.letter}</Pill> },
                  { key: "gpa", header: "Points", align: "center", hideOnMobile: true, sortValue: (r) => r.gpa, cell: (r) => <span className="nums text-sm">{r.gpa.toFixed(2)}</span> },
                  { key: "teacher", header: "Teacher", hideOnMobile: true, cell: (r) => <span className="text-sm text-muted-foreground">{index.teacherName(r.teacherId)}</span> },
                ]}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No marks recorded for this student yet.</p>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="fees" className="pt-3">
          <Panel title="Fee statement" description={`${db.terms.find((t) => t.id === db.currentTermId)?.name} · billed ${money(fees.billed, db.settings.currency)}`}>
            <DataTable
              rowKey={(row) => row.head.id}
              pageSize={10}
              rows={fees.heads}
              columns={[
                { key: "category", header: "Head", cell: (row) => <span className="text-sm font-medium">{row.head.category}</span>, sortValue: (row) => row.head.category },
                { key: "amount", header: "Billed", align: "right", sortValue: (row) => row.head.amount, cell: (row) => <span className="nums text-sm">{money(row.head.amount, db.settings.currency)}</span> },
                { key: "paid", header: "Paid", align: "right", sortValue: (row) => row.paid, cell: (row) => <span className="nums text-sm">{money(row.paid, db.settings.currency)}</span> },
                { key: "due", header: "Due", hideOnMobile: true, sortValue: (row) => row.head.dueDate, cell: (row) => <span className="nums text-sm">{shortDate(row.head.dueDate)}</span> },
                { key: "status", header: "Status", align: "center", cell: (row) => <Pill tone={row.status === "paid" ? "good" : row.status === "overdue" ? "bad" : row.status === "partial" ? "info" : "warn"}>{row.status}</Pill> },
                { key: "history", header: "Payments", hideOnMobile: true, cell: (row) => <span className="text-xs text-muted-foreground">{row.head.payments.length ? row.head.payments.map((p) => `${shortDate(p.date)} · ${money(p.amount, db.settings.currency)}`).join("  |  ") : "None recorded"}</span> },
              ]}
              emptyTitle="No invoices raised"
              emptyDescription="This student has no fee heads for the current term."
            />
          </Panel>
        </TabsContent>

        <TabsContent value="timetable" className="pt-3">
          <Panel title={`Monday for ${cls?.name}`} description={`${week.length} periods · full week in the timetable board`}>
            <ul className="divide-y divide-border/60">
              {week.map((slot) => (
                <li key={slot.id} className="flex items-center gap-3 py-2">
                  <span className="nums w-10 shrink-0 text-xs text-muted-foreground">P{slot.period}</span>
                  <span className="flex-1 text-sm font-medium">{index.subjectName(slot.subjectId)}</span>
                  <span className="text-xs text-muted-foreground">{index.teacherName(slot.teacherId)}</span>
                  <Pill tone="neutral">{slot.room}</Pill>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to={`/timetable?class=${student.classId}`}>Open the full board</Link>
            </Button>
          </Panel>
        </TabsContent>
      </Tabs>

      {editing ? <StudentForm student={student} onClose={() => setEditing(false)} onSave={(next) => { upsert("students", next); setEditing(false); }} /> : null}

      {guardianDraft ? (
        <GuardianForm
          draft={guardianDraft}
          onClose={() => setGuardianDraft(null)}
          onSave={(guardian) => {
            upsert("guardians", guardian);
            upsert("students", { ...student, guardianIds: [...student.guardianIds, guardian.id] });
            setGuardianDraft(null);
          }}
        />
      ) : null}
    </div>
  );
}

function GuardianForm({ draft, onClose, onSave }: { draft: Guardian; onClose: () => void; onSave: (guardian: Guardian) => void }) {
  const [value, setValue] = useState(draft);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-50 grid place-items-end overflow-y-auto bg-black/45 p-0 sm:place-items-center sm:p-6" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-xl border border-border bg-card p-5 shadow-lg sm:rounded-xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold">Link a guardian</h2>
        <p className="text-xs text-muted-foreground">They gain access to this child's attendance, results and fees.</p>
        <Separator className="my-4" />
        <FieldGrid>
          <FormRow label="Name" htmlFor="grd-name">
            <Input id="grd-name" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} />
          </FormRow>
          <FormRow label="Relationship" htmlFor="grd-rel">
            <Select value={value.relation} onValueChange={(v) => setValue({ ...value, relation: v as Guardian["relation"] })}>
              <SelectTrigger id="grd-rel" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Mother", "Father", "Guardian"].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="Email" htmlFor="grd-email">
            <Input id="grd-email" type="email" value={value.email} onChange={(e) => setValue({ ...value, email: e.target.value })} />
          </FormRow>
          <FormRow label="Phone" htmlFor="grd-phone">
            <Input id="grd-phone" value={value.phone} onChange={(e) => setValue({ ...value, phone: e.target.value })} />
          </FormRow>
          <FormRow label="Occupation" htmlFor="grd-occ" className="sm:col-span-2">
            <Input id="grd-occ" value={value.occupation} onChange={(e) => setValue({ ...value, occupation: e.target.value })} />
          </FormRow>
        </FieldGrid>
        {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (value.name.trim().length < 3) {
                setError("Enter the guardian's full name.");
                return;
              }
              onSave({ ...value, name: value.name.trim() });
            }}
          >
            Link guardian
          </Button>
        </div>
      </div>
    </div>
  );
}
