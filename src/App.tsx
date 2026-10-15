import { useEffect, type ComponentType, type ReactNode } from "react";
import { Component } from "react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/src/components/app-shell";
import { PageHeader } from "@/src/components/kit";
import { Link, useRoute } from "@/src/lib/router";
import { canAccess } from "@/src/lib/nav";
import { ROLE_LABEL, SchoolProvider, useSchool } from "@/src/lib/store";
import { roleHomePath } from "@/src/lib/selectors";
import { SignIn } from "@/src/features/sign-in";
import { OverviewPage } from "@/src/features/overview";
import { StudentDetailPage, StudentsPage } from "@/src/features/students";
import { TeachersPage } from "@/src/features/teachers";
import { ClassesPage } from "@/src/features/classes";
import { AttendancePage } from "@/src/features/attendance";
import { TimetablePage } from "@/src/features/timetable";
import { TeacherDayPage } from "@/src/features/my-day";
import { GradebookPage } from "@/src/features/gradebook";
import { ExamsPage } from "@/src/features/exams";
import { AssignmentsPage } from "@/src/features/assignments";
import { FeesPage } from "@/src/features/fees";
import { ReportsPage } from "@/src/features/reports";
import { AnnouncementsPage } from "@/src/features/announcements";
import { MessagesPage } from "@/src/features/messages";
import { SettingsPage } from "@/src/features/settings";
import { PortalPage } from "@/src/features/portal";

type View = { component: React.ComponentType; detail?: boolean };

const VIEWS: Record<string, View> = {
  "/overview": { component: OverviewPage },
  "/students": { component: StudentsPage, detail: true },
  "/teachers": { component: TeachersPage },
  "/classes": { component: ClassesPage },
  "/attendance": { component: AttendancePage },
  "/timetable": { component: TimetablePage },
  "/my-day": { component: TeacherDayPage },
  "/gradebook": { component: GradebookPage },
  "/exams": { component: ExamsPage },
  "/assignments": { component: AssignmentsPage },
  "/fees": { component: FeesPage },
  "/reports": { component: ReportsPage },
  "/announcements": { component: AnnouncementsPage },
  "/messages": { component: MessagesPage },
  "/settings": { component: SettingsPage },
  "/home": { component: PortalPage },
};

class Boundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-2xl space-y-3 p-8">
        <h1 className="font-display text-xl font-semibold">This page hit an error</h1>
        <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
        <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{this.state.error.stack}</pre>
      </div>
    );
  }
}

function Workspace() {
  const { currentUser } = useSchool();
  const route = useRoute();
  const { path, segments } = route;

  useEffect(() => {
    if (currentUser && (path === "/" || path === "")) route.navigate(roleHomePath(currentUser.role), { replace: true });
  }, [path, currentUser, route]);

  if (!currentUser) return <SignIn />;

  const base = `/${segments[0] ?? ""}`;
  const hasDetail = segments.length > 1;
  const view = VIEWS[base];

  if (path === "/" || path === "") return null;

  if (!view) {
    return (
      <AppShell>
        <div className="space-y-4">
          <PageHeader title="That page does not exist" description={`Nothing is registered at ${path}.`} />
          <Button asChild variant="outline" size="sm">
            <Link to={roleHomePath(currentUser.role)}>Back to my desk</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!canAccess(currentUser.role, base)) {
    return (
      <AppShell>
        <div className="space-y-4">
          <PageHeader title="Not part of your access" description={`${ROLE_LABEL[currentUser.role]} accounts cannot open this area. Ask an administrator if you need it.`} />
          <Button asChild variant="outline" size="sm">
            <Link to={roleHomePath(currentUser.role)}>Back to my desk</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const Detail = view.detail && hasDetail ? StudentDetailPage : null;
  const Component = Detail ?? view.component;

  return (
    <AppShell>
      <Component key={`${path}${hasDetail ? `-${segments[1]}` : ""}`} />
    </AppShell>
  );
}

export default function App() {
  return (
    <SchoolProvider>
      <Boundary>
        <Workspace />
      </Boundary>
    </SchoolProvider>
  );
}
