import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type FieldValue,
} from "firebase/firestore";
import { getClientDb } from "@/config/firebase";
import { AppError, ErrorType, rethrowAsAppError } from "@/utils/errorUtils";
import { toMillis } from "@/utils/timestamp";
import type { FlashcardFolder, FlashcardFolderId } from "@/types/flashcard-folder";
import type { UserId } from "@/types/common";

type FlashcardFolderDoc = Omit<FlashcardFolder, "id" | "createdAt" | "updatedAt"> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

function foldersCollectionRef(userId: string) {
  return collection(getClientDb(), "users", userId, "flashcardFolders");
}

function docToFolder(id: string, data: DocumentData): FlashcardFolder {
  return {
    id,
    userId: data.userId ?? "",
    name: data.name ?? "",
    setIds: Array.isArray(data.setIds) ? data.setIds : [],
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export async function listFlashcardFolders(userId: UserId): Promise<FlashcardFolder[]> {
  try {
    const q = query(foldersCollectionRef(userId), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToFolder(d.id, d.data()));
  } catch (error) {
    rethrowAsAppError(error, "Failed to load folders");
  }
}

export async function createFlashcardFolder(args: {
  userId: UserId;
  name: string;
}): Promise<FlashcardFolderId> {
  try {
    const name = args.name.trim();
    if (!name) {
      throw new AppError("Folder name is required", ErrorType.VALIDATION);
    }

    const now = serverTimestamp();
    const docRef = await addDoc(foldersCollectionRef(args.userId), {
      userId: args.userId,
      name,
      setIds: [],
      createdAt: now,
      updatedAt: now,
    } satisfies FlashcardFolderDoc);

    return docRef.id;
  } catch (error) {
    rethrowAsAppError(error, "Failed to create folder");
  }
}

export async function renameFlashcardFolder(args: {
  userId: UserId;
  folderId: FlashcardFolderId;
  name: string;
}): Promise<void> {
  try {
    const name = args.name.trim();
    if (!name) {
      throw new AppError("Folder name is required", ErrorType.VALIDATION);
    }
    const ref = doc(getClientDb(), "users", args.userId, "flashcardFolders", args.folderId);
    await updateDoc(ref, { name, updatedAt: serverTimestamp() });
  } catch (error) {
    rethrowAsAppError(error, "Failed to rename folder");
  }
}

export async function deleteFlashcardFolder(args: {
  userId: UserId;
  folderId: FlashcardFolderId;
}): Promise<void> {
  try {
    const ref = doc(getClientDb(), "users", args.userId, "flashcardFolders", args.folderId);
    await deleteDoc(ref);
  } catch (error) {
    rethrowAsAppError(error, "Failed to delete folder");
  }
}

export async function setFolderSetIds(args: {
  userId: UserId;
  folderId: FlashcardFolderId;
  setIds: string[];
}): Promise<void> {
  try {
    const ref = doc(getClientDb(), "users", args.userId, "flashcardFolders", args.folderId);
    await updateDoc(ref, { setIds: args.setIds, updatedAt: serverTimestamp() });
  } catch (error) {
    rethrowAsAppError(error, "Failed to update folder");
  }
}

