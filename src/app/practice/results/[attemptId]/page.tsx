import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import TestResultsClient from "./TestResultsClient";

export default async function TestResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  if (isAvailable && !user) {
    redirect(
      `/auth/signin?returnTo=${encodeURIComponent(`/practice/results/${attemptId}`)}`
    );
  }

  return <TestResultsClient attemptId={attemptId} authIsGuaranteed={authIsGuaranteed} />;
}
