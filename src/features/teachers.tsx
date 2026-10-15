import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function TeachersPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Teaching staff" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
