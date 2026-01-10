import {
  CardGrid,
  EmptyState,
  ErrorDisplay,
  PageContainer,
  PageHeader,
  SectionContainer,
  ActionLink,
} from "@/components/common/UIComponents";
import { getServerSession } from "@/lib/server-session";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import QuizzesClient from "./QuizzesClient";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { ROUTES } from "@/constants/appConstants";

type ServerQuizRow = {
  id: string;
  title?: string;
  questions?: unknown[];
  userId?: string;
  isPublic?: boolean;
};

export default async function QuizzesPage() {
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  if (isAvailable && !user) {
    return (
      <PageContainer>
        <PageHeader title="Quiz Library" />
        <SignInGate
          title="Sign in to access Quizzes"
          description="Test your knowledge with quick quizzes to identify areas where you need more practice."
          icon={SignInGateIcons.quiz}
          buttonStyle="quiz"
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
          <PageHeader title="Quiz Library" />
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

    const headerActions = (
      <ActionLink href={ROUTES.QUIZZES.CREATE}>Create New Quiz</ActionLink>
    );

    return (
      <PageContainer>
        <PageHeader title="Quiz Library" actions={headerActions} />

        {rows.length === 0 ? (
          <EmptyState
            title="No quizzes available"
            message="Create your first quiz to start testing your knowledge!"
            actionLink={ROUTES.QUIZZES.CREATE}
            actionText="Create New Quiz"
          />
        ) : (
          <CardGrid>
            {rows.map((quiz) => (
              <SectionContainer key={quiz.id}>
                <h2 className="text-lg font-bold mb-2">
                  {quiz.title || "Untitled quiz"}
                </h2>
                <p className="text-muted-foreground mb-2">
                  Questions: {quiz.questions?.length ?? 0}
                </p>
                <div className="mt-4">
                  <ActionLink href={ROUTES.QUIZZES.QUIZ(quiz.id)} variant="primary">
                    Take Quiz
                  </ActionLink>
                </div>
              </SectionContainer>
            ))}
          </CardGrid>
        )}
      </PageContainer>
    );
  }

  // Fallback for environments where server session verification isn't configured
  // (or for local setups without firebase-admin credentials).
  return <QuizzesClient authIsGuaranteed={authIsGuaranteed} />;
}
