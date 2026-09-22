import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study-guides · create | AdvanceMe AI",
  description: "AdvanceMe AI — Study-guides · create",
};

import CreateStudyGuideClient from "./CreateStudyGuideClient";

export default function Page() {
  return <CreateStudyGuideClient />;
}
