import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test · sectionId | AdvanceMe AI",
  description: "AdvanceMe AI — Test · sectionId",
};

import TestSectionClient from "./TestSectionClient";

export default function Page() {
  return <TestSectionClient />;
}
