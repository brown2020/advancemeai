import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Class | AdvanceMe AI",
  description: "Class sets, members and progress",
};

import GroupDetailClient from "./GroupDetailClient";

export default function Page() {
  return <GroupDetailClient />;
}
