import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import TestResultsClient from "./TestResultsClient";
import { signInHref } from "@/constants/appConstants";

export const metadata: Metadata = {
  title: "Practice Results | AdvanceMe AI",
  description: "Review your SAT practice results",
};

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
      signInHref(`/practice/results/${attemptId}`)
    );
  }

  return <TestResultsClient attemptId={attemptId} authIsGuaranteed={authIsGuaranteed} />;
}
