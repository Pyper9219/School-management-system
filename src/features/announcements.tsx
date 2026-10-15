import { InlineEmpty, PageHeader } from "@/src/components/kit";

export function AnnouncementsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Announcements" />
      <InlineEmpty title="Being assembled" description="This module is under construction." />
    </div>
  );
}
