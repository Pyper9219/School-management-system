import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function ExamsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Examination schedule" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
