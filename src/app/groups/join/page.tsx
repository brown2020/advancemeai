import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups · join | AdvanceMe AI",
  description: "AdvanceMe AI — Groups · join",
};

import JoinGroupClient from "./JoinGroupClient";

export default function Page() {
  return <JoinGroupClient />;
}
