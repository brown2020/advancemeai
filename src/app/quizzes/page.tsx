import { Suspense } from "react";
import { PageContainer, PageHeader, LoadingState } from "@/components/common/UIComponents";
import { getServerSession } from "@/lib/server-session";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import QuizzesClient from "./QuizzesClient";

function QuizzesFallback() {
  return (
    <PageContainer>
      <PageHeader title="Quiz Library" />
      <LoadingState message="Loading quizzes..." />
    </PageContainer>
  );
}

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

  return (
    <Suspense fallback={<QuizzesFallback />}>
      <QuizzesClient authIsGuaranteed={authIsGuaranteed} />
    </Suspense>
  );
}
