import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live | AdvanceMe AI",
  description: "AdvanceMe AI — Live",
};

import LivePageClient from "./LivePageClient";

export default function Page() {
  return <LivePageClient />;
}
