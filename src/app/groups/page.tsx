import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups | AdvanceMe AI",
  description: "AdvanceMe AI — Groups",
};

import GroupsPageClient from "./GroupsPageClient";

export default function Page() {
  return <GroupsPageClient />;
}
