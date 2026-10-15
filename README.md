# School-management-system

Meridian Grove Academy — a school management front end for administrators, teaching staff, parents and students.

This is a working prototype. Every screen is built and clickable, and the school records it displays are seeded sample data generated in the browser. Nothing is sent to a server: the database lives in `localStorage`, so a reset restores the seeded school. Shared persistence and real authentication are deliberately not implemented yet.

## Develop

Node 22.12 or later in the 22.x series is required; `scripts/check-node.mjs` stops the build on any other version.

```sh
npm ci
npm run dev      # http://127.0.0.1:5173
```

Pick any demo account on the sign-in screen — each one opens the workspace with that role's navigation and access.

```sh
npm run build    # type check + static output in dist/
npm run preview  # serve dist/
```

Routes are hash-based (`#/students/stu-…`), so a refresh or a deep link always resolves.

## Layout

| Path | Contents |
| --- | --- |
| `src/lib/types.ts` | Domain model: students, staff, classes, attendance, assessments, fees, messaging |
| `src/lib/seed.ts` | Deterministic seeded school (166 students, 12 sections, 20 staff) re-anchored to today |
| `src/lib/store.tsx` | `SchoolProvider`: state, `localStorage` persistence, session |
| `src/lib/selectors.ts` | Derived reads — registers, weighted results, GPA, fee ageing, timetable conflicts |
| `src/lib/router.tsx`, `nav.tsx` | Hash router and role-scoped navigation |
| `src/components/` | App shell plus shared UI kit (data table, panels, filters, dialogs) |
| `src/features/` | One module per area; `students.tsx` is the completed exemplar |
| `components/ui`, `hooks`, `lib`, `vendor` | Bundled Shadcn catalog and vendored stylesheet |
| `dev/smoke.ts` | Headless assertion pass over the seed and derived reads |

Module status: sign-in, school overview, and the students roster and record are complete. Teaching staff, classes, attendance, timetable, gradebook, exams, assignments, fees, reports, announcements, messages, settings and the family portal render inside the shell and are still to be assembled.

`functions/` holds the unused starter example for a hosted backend. See `PROVENANCE.md` and `vendor/` for template attribution and the preserved stylesheet license.
