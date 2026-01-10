import { getServerSession } from "@/lib/server-session";
import { getAdminDbOptional } from "@/config/firebase-admin";
import FlashcardsClient from "./FlashcardsClient";
import type { FlashcardSet } from "@/types/flashcard";
import type { FlashcardFolder } from "@/types/flashcard-folder";
import { mapFlashcardFolder, mapFlashcardSet } from "@/lib/server-firestore";

export default async function FlashcardsPage() {
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  const db = getAdminDbOptional();
  if (!db) {
    return <FlashcardsClient authIsGuaranteed={authIsGuaranteed} />;
  }

  // Server-first: preload public sets for everyone; preload user sets/folders only if signed in.
  const [publicSnap, yourSnap, foldersSnap] = await Promise.all([
    db
      .collection("flashcardSets")
      .where("isPublic", "==", true)
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get(),
    authIsGuaranteed
      ? db
          .collection("flashcardSets")
          .where("userId", "==", user!.uid)
          .orderBy("updatedAt", "desc")
          .limit(50)
          .get()
      : Promise.resolve(null),
    authIsGuaranteed
      ? db
          .collection("users")
          .doc(user!.uid)
          .collection("flashcardFolders")
          .orderBy("updatedAt", "desc")
          .get()
      : Promise.resolve(null),
  ]);

  const initialPublicSets: FlashcardSet[] = publicSnap.docs.map((d) =>
    mapFlashcardSet(d.id, d.data() as Record<string, unknown>)
  );

  const initialYourSets: FlashcardSet[] | undefined = yourSnap
    ? yourSnap.docs.map((d) => mapFlashcardSet(d.id, d.data() as Record<string, unknown>))
    : undefined;

  const initialFolders: FlashcardFolder[] | undefined = foldersSnap
    ? foldersSnap.docs.map((d) =>
        mapFlashcardFolder(d.id, d.data() as Record<string, unknown>, user!.uid)
      )
    : undefined;

  return (
    <FlashcardsClient
      authIsGuaranteed={authIsGuaranteed}
      initialPublicSets={initialPublicSets}
      initialYourSets={initialYourSets}
      initialFolders={initialFolders}
    />
  );
}
