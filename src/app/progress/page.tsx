import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress | AdvanceMe AI",
  description: "Track your XP, streaks, card mastery, and SAT practice accuracy.",
};

import ProgressPageClient from "./ProgressPageClient";

export default function Page() {
  return <ProgressPageClient />;
}
