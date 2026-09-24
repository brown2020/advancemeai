import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import PracticeSectionClient from "./PracticeSectionClient";
import { signInHref } from "@/constants/appConstants";

export const metadata: Metadata = {
  title: "Section Practice | AdvanceMe AI",
  description: "Adaptive, AI-generated SAT section practice",
};

export default async function PracticeSectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  if (isAvailable && !user) {
    redirect(signInHref(`/practice/${sectionId}`));
  }

  return <PracticeSectionClient sectionId={sectionId} authIsGuaranteed={authIsGuaranteed} />;
}
