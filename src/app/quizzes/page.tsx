import type { Metadata } from "next";
import {
  ErrorDisplay,
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import { getServerSession } from "@/lib/server-session";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import { NewQuizLink, QuizLibrary } from "@/components/quizzes/QuizLibrary";
import type { QuizSummary } from "@/components/quizzes/QuizCard";
import QuizzesClient from "./QuizzesClient";
import { getAdminDbOptional } from "@/config/firebase-admin";

export const metadata: Metadata = {
  title: "Quizzes | AdvanceMe AI",
  description: "Browse and take quizzes",
};

const PAGE_TITLE = "Quizzes";
const PAGE_DESCRIPTION = "Quick multiple-choice checks on what you know.";

type ServerQuizRow = {
  id: string;
  title?: string;
  questions?: unknown[];
  userId?: string;
  isPublic?: boolean;
  createdAt?: number;
};

export default async function QuizzesPage() {
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  if (isAvailable && !user) {
    return (
      <PageContainer>
        <PageHeader title={PAGE_TITLE} />
        <SignInGate
          title="Sign in to access Quizzes"
          description="Test your knowledge with quick quizzes to identify areas where you need more practice."
          icon={SignInGateIcons.quiz}
        />
      </PageContainer>
    );
  }

  // When server session verification is available, prefer server-rendered data
  // to avoid client-side fetch + auth flicker.
  if (authIsGuaranteed) {
    const db = getAdminDbOptional();
    if (!db) {
      return (
        <PageContainer>
          <PageHeader title={PAGE_TITLE} />
          <ErrorDisplay message="Server missing credentials. Please try again later." />
        </PageContainer>
      );
    }

    const snapshot = await db
      .collection("quizzes")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const rows: ServerQuizRow[] = snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .filter((quiz) => {
        const q = quiz as Record<string, unknown>;
        const isLegacyPublic = !Object.prototype.hasOwnProperty.call(q, "isPublic");
        const isPublic = q.isPublic === true || isLegacyPublic;
        const isOwner = Boolean(user?.uid) && q.userId === user?.uid;
        return isPublic || isOwner;
      }) as ServerQuizRow[];

    const quizzes: QuizSummary[] = rows.map((row) => ({
      id: row.id,
      title: row.title || "Untitled quiz",
      questionCount: row.questions?.length ?? 0,
      isOwner: Boolean(user?.uid) && row.userId === user?.uid,
      isPublic: row.isPublic !== false,
      createdAt: typeof row.createdAt === "number" ? row.createdAt : undefined,
    }));

    return (
      <PageContainer>
        <PageHeader
          title={PAGE_TITLE}
          description={PAGE_DESCRIPTION}
          actions={<NewQuizLink />}
        />
        <QuizLibrary quizzes={quizzes} />
      </PageContainer>
    );
  }

  // Fallback for environments where server session verification isn't configured
  // (or for local setups without firebase-admin credentials).
  return <QuizzesClient authIsGuaranteed={authIsGuaranteed} />;
}
