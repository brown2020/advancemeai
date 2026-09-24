import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import FullTestResultsClient from "./FullTestResultsClient";
import { signInHref } from "@/constants/appConstants";

export const metadata: Metadata = {
  title: "Full Test Results | AdvanceMe AI",
  description: "Your full-length Digital SAT results and study plan",
};

export default async function FullTestResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  if (isAvailable && !user) {
    redirect(
      signInHref(
        `/practice/full-test/results/${sessionId}`
      )
    );
  }

  return (
    <FullTestResultsClient
      sessionId={sessionId}
      authIsGuaranteed={authIsGuaranteed}
    />
  );
}
