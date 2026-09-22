import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live · host | AdvanceMe AI",
  description: "AdvanceMe AI — Live · host",
};

import LiveHostClient from "./LiveHostClient";

export default function Page() {
  return <LiveHostClient />;
}
