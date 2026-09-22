import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups · groupId | AdvanceMe AI",
  description: "AdvanceMe AI — Groups · groupId",
};

import GroupDetailClient from "./GroupDetailClient";

export default function Page() {
  return <GroupDetailClient />;
}
