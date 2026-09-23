import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New class | AdvanceMe AI",
  description: "Create a class on AdvanceMe AI",
};

import CreateGroupClient from "./CreateGroupClient";

export default function Page() {
  return <CreateGroupClient />;
}
