import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function ReportsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Reports" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
