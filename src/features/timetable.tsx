import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function TimetablePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Timetable" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
