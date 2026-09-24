import EditFlashcardSetClient from "./EditFlashcardSetClient";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { mapFlashcardSet } from "@/lib/server-firestore";
import { signInHref } from "@/constants/appConstants";

export const metadata = {
  title: "Edit set | Advance.me",
};

export default async function Page({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;

  const { isAvailable, user } = await getServerSession();
  if (isAvailable && !user) {
    redirect(
      signInHref(`/flashcards/${setId}/edit`)
    );
  }

  const db = getAdminDbOptional();
  if (!db || !user) {
    return <EditFlashcardSetClient setId={setId} />;
  }

  const snap = await db.collection("flashcardSets").doc(setId).get();
  if (!snap.exists) {
    redirect("/flashcards");
  }

  const data = (snap.data() || {}) as Record<string, unknown>;
  const setOwnerId = String(data.userId ?? "");
  if (setOwnerId !== user.uid) {
    // Not allowed to edit; send them back to the study page.
    redirect(`/flashcards/${setId}`);
  }

  const initialSet = mapFlashcardSet(snap.id, data);
  return <EditFlashcardSetClient setId={setId} initialSet={initialSet} />;
}
