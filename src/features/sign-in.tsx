import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarCircle, Pill, SearchField } from "@/src/components/kit";
import { ROLE_LABEL, useSchool } from "@/src/lib/store";
import type { Role } from "@/src/lib/types";

const ROLE_ORDER: Role[] = ["admin", "teacher", "parent", "student"];
const ROLE_NOTE: Record<Role, string> = {
  admin: "Full access to records, finance and publishing.",
  teacher: "Registers, gradebook and their own classes.",
  parent: "Every linked child in one place.",
  student: "Own timetable, results and fees.",
};

export function SignIn() {
  const { db, signIn } = useSchool();
  const [query, setQuery] = useState("");

  const matches = db.users.filter((user) => user.name.toLowerCase().includes(query.toLowerCase()) || user.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-sidebar px-10 py-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="rule-paper pointer-events-none absolute inset-0 opacity-[0.06]" />
        <div className="relative">
          <span className="grid size-11 place-items-center rounded-full border border-sidebar-primary/50 font-display text-base font-semibold text-sidebar-primary">MG</span>
          <h1 className="font-display mt-6 text-4xl leading-[1.1] font-semibold">
            Meridian Grove
            <span className="block text-sidebar-primary/90">Academy</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm text-sidebar-foreground/65">
            One register for admissions, attendance, assessment and fees — with separate windows for staff and families.
          </p>
        </div>
        <div className="relative space-y-4">
          <dl className="grid grid-cols-3 gap-6 border-t border-sidebar-border pt-6">
            <div>
              <dt className="text-[11px] tracking-wide text-sidebar-foreground/50 uppercase">Students</dt>
              <dd className="nums font-display mt-1 text-2xl font-semibold">{db.students.filter((s) => s.status === "active").length}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wide text-sidebar-foreground/50 uppercase">Classes</dt>
              <dd className="nums font-display mt-1 text-2xl font-semibold">{db.classes.length}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wide text-sidebar-foreground/50 uppercase">Staff</dt>
              <dd className="nums font-display mt-1 text-2xl font-semibold">{db.teachers.length}</dd>
            </div>
          </dl>
          <p className="text-xs text-sidebar-foreground/45">
            Sample records for demonstration. Nothing entered here is stored outside this browser.
          </p>
        </div>
      </section>

      <section className="flex flex-col justify-center px-5 py-10 md:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold">Choose a window in</h2>
              <p className="mt-1 text-sm text-muted-foreground">Each account opens the same school from a different desk.</p>
            </div>
            <Pill tone="brand" className="hidden sm:inline-flex">Demo</Pill>
          </div>

          <div className="mt-5">
            <SearchField value={query} onChange={setQuery} placeholder="Search staff or families" />
          </div>

          <div className="mt-5 space-y-6">
            {ROLE_ORDER.map((role) => {
              const users = matches.filter((u) => u.role === role);
              if (!users.length) return null;
              return (
                <div key={role}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{ROLE_LABEL[role]}s</h3>
                    <span className="text-[11px] text-muted-foreground/80">{ROLE_NOTE[role]}</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {users.map((user) => (
                      <Button
                        key={user.id}
                        variant="outline"
                        className="group flex h-auto w-full items-center gap-3 justify-start rounded-lg border-border/80 bg-card px-3 py-2.5 text-left hover:border-primary/40 hover:bg-accent"
                        onClick={() => signIn(user.id)}
                      >
                        <AvatarCircle name={user.name} color={user.color} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{user.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{user.title}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
            {!matches.length ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No account matches “{query}”. Try a name, or “Parent”, “Teacher”, “Student”.
              </p>
            ) : null}
          </div>

          <div className="mt-6 border-t border-border/70 pt-4 text-xs text-muted-foreground">
            Pick any account to explore. Signing out returns here, and school settings can rebuild the sample records at any time.
          </div>
        </div>
      </section>
    </div>
  );
}
