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
import { isQuizOwner, listVisibleQuizzes } from "@/lib/server-quizzes";

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

    const userId = user?.uid ?? null;
    const rows = (await listVisibleQuizzes(db, userId)) as ServerQuizRow[];

    const quizzes: QuizSummary[] = rows.map((row) => ({
      id: row.id,
      title: row.title || "Untitled quiz",
      questionCount: row.questions?.length ?? 0,
      isOwner: isQuizOwner(row, userId),
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
