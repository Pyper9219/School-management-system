import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function AttendancePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Attendance register" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
