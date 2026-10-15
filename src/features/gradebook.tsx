import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function GradebookPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Gradebook" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
