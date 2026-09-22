import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debug | AdvanceMe AI",
  description: "AdvanceMe AI — Debug",
};

import DebugPageClient from "./DebugPageClient";

export default function Page() {
  return <DebugPageClient />;
}
