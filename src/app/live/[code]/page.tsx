import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live · code | AdvanceMe AI",
  description: "AdvanceMe AI — Live · code",
};

import LiveCodeClient from "./LiveCodeClient";

export default function Page() {
  return <LiveCodeClient />;
}
