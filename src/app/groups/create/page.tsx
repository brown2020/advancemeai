import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups · create | AdvanceMe AI",
  description: "AdvanceMe AI — Groups · create",
};

import CreateGroupClient from "./CreateGroupClient";

export default function Page() {
  return <CreateGroupClient />;
}
