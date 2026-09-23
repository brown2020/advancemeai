import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Classes | AdvanceMe AI",
  description: "Your classes and study groups on AdvanceMe AI",
};

import GroupsPageClient from "./GroupsPageClient";

export default function Page() {
  return <GroupsPageClient />;
}
