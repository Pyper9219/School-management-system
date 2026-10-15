import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function PortalPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="My dashboard" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
