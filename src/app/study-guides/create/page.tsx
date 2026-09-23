import type { Metadata } from "next";
import CreateStudyGuideClient from "./CreateStudyGuideClient";

export const metadata: Metadata = {
  title: "Create a study guide | Advance.me",
  description: "Turn your notes into an AI study guide with flashcards and practice questions.",
};

export default function Page() {
  return <CreateStudyGuideClient />;
}
