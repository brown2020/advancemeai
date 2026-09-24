import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import NewQuizClient from "./NewQuizClient";
import { signInHref } from "@/constants/appConstants";


export const metadata: Metadata = {
  title: "New quiz | AdvanceMe AI",
  description: "Create a multiple-choice quiz",
};

export default async function NewQuizPage() {
  const { isAvailable, user } = await getServerSession();

  if (isAvailable && !user) {
    redirect(signInHref("/quizzes/new"));
  }

  return <NewQuizClient />;
}
