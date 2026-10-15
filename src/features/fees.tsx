import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function FeesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Fees and payments" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
