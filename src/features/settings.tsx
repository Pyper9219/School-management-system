import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="School settings" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
