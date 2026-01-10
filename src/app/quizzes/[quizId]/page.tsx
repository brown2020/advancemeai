import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import QuizDetailClient from "./QuizDetailClient";

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  if (isAvailable && !user) {
    redirect(`/auth/signin?returnTo=${encodeURIComponent(`/quizzes/${quizId}`)}`);
  }

  return <QuizDetailClient quizId={quizId} authIsGuaranteed={authIsGuaranteed} />;
}
