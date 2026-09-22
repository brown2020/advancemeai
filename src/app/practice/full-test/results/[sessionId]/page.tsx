import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import FullTestResultsClient from "./FullTestResultsClient";


export const metadata: Metadata = {
  title: "Practice · full-test · results · sessionId | AdvanceMe AI",
  description: "AdvanceMe AI — Practice · full-test · results · sessionId",
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
      `/auth/signin?returnTo=${encodeURIComponent(
        `/practice/full-test/results/${sessionId}`
      )}`
    );
  }

  return (
    <FullTestResultsClient
      sessionId={sessionId}
      authIsGuaranteed={authIsGuaranteed}
    />
  );
}
