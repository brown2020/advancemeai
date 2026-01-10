import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import QuizDetailClient from "./QuizDetailClient";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { isPublicFromData } from "@/lib/server-firestore";

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

  const db = getAdminDbOptional();
  if (!db || !user) {
    return <QuizDetailClient quizId={quizId} authIsGuaranteed={authIsGuaranteed} />;
  }

  const snap = await db.collection("quizzes").doc(quizId).get();
  if (!snap.exists) {
    redirect("/quizzes");
  }

  const data = (snap.data() || {}) as Record<string, unknown>;
  const isPublic = isPublicFromData(data);
  const isOwner = data.userId === user.uid;
  if (!isPublic && !isOwner) {
    redirect("/quizzes");
  }

  const questionsRaw = Array.isArray(data.questions) ? data.questions : [];
  const questions = questionsRaw
    .map((q) => (q && typeof q === "object" ? (q as Record<string, unknown>) : null))
    .filter((q): q is Record<string, unknown> => Boolean(q))
    .map((q) => ({
      text: String(q.text ?? ""),
      options: Array.isArray(q.options)
        ? (q.options as unknown[]).map((o) => String(o))
        : [],
      correctAnswer: String(q.correctAnswer ?? ""),
    }))
    .filter((q) => q.text.length > 0 && q.options.length > 0 && q.correctAnswer.length > 0);

  const initialQuiz = {
    id: snap.id,
    title: String(data.title ?? "Untitled quiz"),
    questions,
  };

  return (
    <QuizDetailClient
      quizId={quizId}
      authIsGuaranteed={authIsGuaranteed}
      initialQuiz={initialQuiz}
    />
  );
}
