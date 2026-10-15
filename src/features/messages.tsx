import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function MessagesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Messages" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
