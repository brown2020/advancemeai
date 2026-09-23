import type { Metadata } from "next";
import TestSectionClient from "./TestSectionClient";

export const metadata: Metadata = {
  title: "Adaptive Practice | AdvanceMe AI",
  description: "Adaptive SAT practice, one question at a time",
};

export default function Page() {
  return <TestSectionClient />;
}
