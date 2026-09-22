import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress | AdvanceMe AI",
  description: "AdvanceMe AI — Progress",
};

import ProgressPageClient from "./ProgressPageClient";

export default function Page() {
  return <ProgressPageClient />;
}
