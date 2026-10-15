import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, CalendarCheck, Megaphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarCircle, Bar as MiniBar, PageHeader, Panel, Pill, StatCard } from "@/src/components/kit";
import { money, percent, relativeTime, shortDate } from "@/src/lib/format";
import { Link } from "@/src/lib/router";
import { useSchool } from "@/src/lib/store";
import { useSchoolIndex } from "@/src/lib/selectors";

const trendConfig: ChartConfig = {
  rate: { label: "Attended", color: "var(--chart-1)" },
};

const classConfig: ChartConfig = {
  absent: { label: "Absent", color: "var(--chart-4)" },
  present: { label: "Present", color: "var(--chart-3)" },
};

export function OverviewPage() {
  const { db, asOf } = useSchool();
  const index = useSchoolIndex();
  const kpis = index.kpis(asOf);
  const trend = index.attendanceTrend(12);
  const term = db.terms.find((t) => t.id === db.currentTermId)!;

  const registerDay = kpis.attendanceDay ?? asOf;
  const classRows = db.classes.map((cls) => {
    const register = index.registerOn(cls.id, registerDay);
    const absent = register.filter((r) => r.status === "absent").length;
    return { name: cls.name.replace("Grade ", "G"), present: register.length - absent, absent };
  });

  const attention = [...index.openRegisterClasses(asOf).map((id) => ({ kind: "register" as const, id, label: index.className(id) })),
    ...db.students
      .filter((s) => s.status === "active")
      .map((s) => ({ s, rate: index.attendanceSummary(s.id, index.schoolRange().from, index.schoolRange().to).rate }))
      .filter((row) => row.rate < 90)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 8)
      .map((row) => ({ kind: "attendance" as const, id: row.s.id, label: row.s.name, rate: row.rate, className: index.className(row.s.classId) })),
  ];

  const overdueStudents = db.students
    .filter((s) => s.status === "active")
    .map((s) => ({ student: s, fees: index.fees(s.id, asOf) }))
    .filter((row) => row.fees.overdue > 0)
    .sort((a, b) => b.fees.overdue - a.fees.overdue)
    .slice(0, 6);

  const announcements = index.announcementsFor(db.users.find((u) => u.role === "admin")!).slice(0, 4);

  return (
    <div className="space-y-5">
      <PageHeader
        title="School overview"
        description={`${term.name}, ${term.academicYear} · ${db.students.filter((s) => s.status === "active").length} students on roll across ${db.classes.length} sections.`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/announcements">
                <Megaphone className="size-4" /> Announcements
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/attendance">
                <CalendarCheck className="size-4" /> Registers
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Students on roll" value={kpis.students} hint={`${kpis.teachers} teaching staff · ${kpis.classes} sections`} />
        <StatCard label="Attendance" value={kpis.attendanceDay ? `${kpis.attendanceLatest}%` : "—"} tone={kpis.attendanceLatest >= 95 ? "good" : kpis.attendanceLatest >= 90 ? "warn" : "bad"} hint={kpis.attendanceDay ? `Last closed register · ${shortDate(kpis.attendanceDay)}` : "No register closed yet"} />
        <StatCard label="Open registers" value={kpis.openRegisterClasses} tone={kpis.openRegisterClasses ? "warn" : "good"} hint={kpis.openRegisterClasses ? "Sections still to mark" : "Every section accounted for"} />
        <StatCard label="Fees collected" value={`${kpis.collectionRate}%`} tone={kpis.collectionRate >= 80 ? "good" : "warn"} hint={`${money(kpis.collected, db.settings.currency)} of ${money(kpis.billed, db.settings.currency)}`} />
        <StatCard label="Overdue balance" value={money(kpis.overdueAmount, db.settings.currency)} tone={kpis.overdueAmount ? "bad" : "good"} hint={`${kpis.overdueHeads} invoice lines past due`} />
        <StatCard label="Below 90% attendance" value={kpis.atRisk} tone={kpis.atRisk ? "warn" : "good"} hint="Term to date" />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Attendance, last 12 school days" description="Share of the roll marked present, late or excused">
          <ChartContainer config={trendConfig} className="aspect-[16/7] w-full">
            <AreaChart data={trend} margin={{ left: -18, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="attFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-rate)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="var(--color-rate)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis domain={[80, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={34} />
              <Tooltip formatter={(value: unknown) => [`${value}%`, "Attended"]} labelFormatter={(label: unknown) => shortDate(String(label))} />
              <Area type="monotone" dataKey="rate" stroke="var(--color-rate)" strokeWidth={2} fill="url(#attFill)" />
            </AreaChart>
          </ChartContainer>
        </Panel>

        <Panel title="Absence by section" description={`Registers closed up to ${shortDate(registerDay)}`}>
          {classRows.some((r) => r.present + r.absent > 0) ? (
            <ChartContainer config={classConfig} className="aspect-[16/7] w-full">
              <BarChart data={classRows} margin={{ left: -20, right: 6, top: 6 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={30} />
                <Tooltip />
                <Bar dataKey="present" stackId="a" fill="var(--color-present)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="absent" stackId="a" fill="var(--color-absent)" radius={[3, 3, 0, 0]}>
                  {classRows.map((row) => (
                    <Cell key={row.name} fill={row.absent > 2 ? "var(--color-absent)" : "var(--color-absent)"} fillOpacity={row.absent ? 1 : 0.15} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No registers have been opened for today yet.</p>
          )}
        </Panel>

        <Panel title="Needs attention" description="Unmarked registers and attendance risk">
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {attention.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nothing outstanding. Every register is closed.</p> : null}
            {attention.slice(0, 12).map((item) => (
              <div key={`${item.kind}-${item.id}`} className="flex items-center gap-2.5 rounded-md border border-border/70 bg-background/60 px-2.5 py-2">
                <AlertTriangle className={item.kind === "register" ? "size-4 shrink-0 text-amber-600" : "size-4 shrink-0 text-rose-600"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.kind === "register" ? "Register not taken today" : `${item.className} · ${item.rate}% this term`}</p>
                </div>
                <Button asChild size="xs" variant="outline">
                  <Link to={item.kind === "register" ? `/attendance?class=${item.id}` : `/students/${item.id}`}>
                    {item.kind === "register" ? "Take" : "Open"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Fee balances" description="Largest outstanding amounts this term" className="xl:col-span-2">
          <Tabs defaultValue="overdue">
            <TabsList variant="line">
              <TabsTrigger value="overdue">Overdue ({overdueStudents.length})</TabsTrigger>
              <TabsTrigger value="collections">Collection</TabsTrigger>
            </TabsList>
            <TabsContent value="overdue" className="pt-2">
              {overdueStudents.length ? (
                <ul className="divide-y divide-border/70">
                  {overdueStudents.map(({ student, fees }) => (
                    <li key={student.id} className="flex items-center gap-3 py-2.5">
                      <AvatarCircle name={student.name} size={30} color="#7a5a19" />
                      <div className="min-w-0 flex-1">
                        <Link to={`/students/${student.id}`} className="truncate text-sm font-medium hover:underline">
                          {student.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{index.className(student.classId)} · {student.admissionNo}</p>
                      </div>
                      <div className="w-28 shrink-0">
                        <MiniBar value={percent(fees.paid, fees.billed)} tone={fees.overdue ? "bad" : "warn"} />
                        <p className="nums mt-1 text-right text-[11px] text-muted-foreground">{percent(fees.paid, fees.billed)}% settled</p>
                      </div>
                      <Pill tone="bad" className="nums shrink-0">{money(fees.overdue, db.settings.currency)} due</Pill>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No invoice is past its due date.</p>
              )}
            </TabsContent>
            <TabsContent value="collections" className="pt-3">
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">Collected this term</span>
                    <span className="nums font-semibold">{money(kpis.collected, db.settings.currency)}</span>
                  </div>
                  <MiniBar value={kpis.collectionRate} tone="good" className="mt-2 h-2" />
                </div>
                <div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">Still outstanding</span>
                    <span className="nums font-semibold">{money(kpis.billed - kpis.collected, db.settings.currency)}</span>
                  </div>
                  <MiniBar value={percent(kpis.billed - kpis.collected, kpis.billed)} tone="warn" className="mt-2 h-2" />
                </div>
                <Separator />
                <Button asChild variant="outline" size="sm">
                  <Link to="/fees">
                    <Wallet className="size-4" /> Open the fee ledger <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Panel>

        <Panel title="Latest notices" description="Published to families and staff">
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{a.title}</p>
                  {a.pinned ? <Pill tone="brand">Pinned</Pill> : null}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground/80">{a.authorName} · {relativeTime(a.publishedAt)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
