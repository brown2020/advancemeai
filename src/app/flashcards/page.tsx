import { getServerSession } from "@/lib/server-session";
import { getAdminDbOptional } from "@/config/firebase-admin";
import FlashcardsClient from "./FlashcardsClient";
import type { FlashcardSet } from "@/types/flashcard";
import type { FlashcardFolder } from "@/types/flashcard-folder";

function toMillis(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toMillis" in value) {
    const v = value as { toMillis?: unknown };
    if (typeof v.toMillis === "function") {
      // Important: call as a method to preserve `this` binding (Firestore Timestamp relies on it).
      return v.toMillis();
    }
  }
  return Date.now();
}

function docToFlashcardSet(id: string, data: Record<string, unknown>): FlashcardSet {
  const cardsRaw = Array.isArray(data.cards) ? data.cards : [];
  const cards = cardsRaw
    .map((c) => (c && typeof c === "object" ? (c as Record<string, unknown>) : null))
    .filter((c): c is Record<string, unknown> => Boolean(c))
    .map((c) => ({
      id: String(c.id ?? ""),
      term: String(c.term ?? ""),
      definition: String(c.definition ?? ""),
      createdAt: toMillis(c.createdAt),
    }));

  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    cards,
    userId: String(data.userId ?? ""),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    isPublic: Boolean(data.isPublic),
  };
}

function docToFolder(
  id: string,
  data: Record<string, unknown>,
  userId: string
): FlashcardFolder {
  return {
    id,
    userId,
    name: String(data.name ?? ""),
    setIds: Array.isArray(data.setIds) ? (data.setIds as string[]) : [],
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

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
    docToFlashcardSet(d.id, d.data() as Record<string, unknown>)
  );

  const initialYourSets: FlashcardSet[] | undefined = yourSnap
    ? yourSnap.docs.map((d) => docToFlashcardSet(d.id, d.data() as Record<string, unknown>))
    : undefined;

  const initialFolders: FlashcardFolder[] | undefined = foldersSnap
    ? foldersSnap.docs.map((d) =>
        docToFolder(d.id, d.data() as Record<string, unknown>, user!.uid)
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
