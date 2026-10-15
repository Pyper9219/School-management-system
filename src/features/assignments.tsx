import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function AssignmentsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Assignments" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
