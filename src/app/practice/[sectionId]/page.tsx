import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import PracticeSectionClient from "./PracticeSectionClient";

export default async function PracticeSectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  if (isAvailable && !user) {
    redirect(`/auth/signin?returnTo=${encodeURIComponent(`/practice/${sectionId}`)}`);
  }

  return <PracticeSectionClient sectionId={sectionId} authIsGuaranteed={authIsGuaranteed} />;
}
