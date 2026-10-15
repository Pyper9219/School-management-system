import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function TeacherDayPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Today" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
