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
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { AppError, ErrorType, logError } from "@/utils/errorUtils";
import { timestampToNumberOrNow } from "@/utils/timestamp";
import type { FlashcardFolder, FlashcardFolderId } from "@/types/flashcard-folder";
import type { UserId } from "@/types/common";

type FlashcardFolderDoc = Omit<FlashcardFolder, "id" | "createdAt" | "updatedAt"> & {
  createdAt: any;
  updatedAt: any;
};

function foldersCollectionRef(userId: string) {
  return collection(db, "users", userId, "flashcardFolders");
}

function docToFolder(id: string, data: any): FlashcardFolder {
  return {
    id,
    userId: data.userId ?? "",
    name: data.name ?? "",
    setIds: Array.isArray(data.setIds) ? data.setIds : [],
    createdAt: timestampToNumberOrNow(data.createdAt),
    updatedAt: timestampToNumberOrNow(data.updatedAt),
  };
}

export async function listFlashcardFolders(userId: UserId): Promise<FlashcardFolder[]> {
  try {
    const q = query(foldersCollectionRef(userId), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToFolder(d.id, d.data()));
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to load folders", ErrorType.UNKNOWN);
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
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to create folder", ErrorType.UNKNOWN);
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
    const ref = doc(db, "users", args.userId, "flashcardFolders", args.folderId);
    await updateDoc(ref, { name, updatedAt: serverTimestamp() });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to rename folder", ErrorType.UNKNOWN);
  }
}

export async function deleteFlashcardFolder(args: {
  userId: UserId;
  folderId: FlashcardFolderId;
}): Promise<void> {
  try {
    const ref = doc(db, "users", args.userId, "flashcardFolders", args.folderId);
    await deleteDoc(ref);
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to delete folder", ErrorType.UNKNOWN);
  }
}

export async function setFolderSetIds(args: {
  userId: UserId;
  folderId: FlashcardFolderId;
  setIds: string[];
}): Promise<void> {
  try {
    const ref = doc(db, "users", args.userId, "flashcardFolders", args.folderId);
    await updateDoc(ref, { setIds: args.setIds, updatedAt: serverTimestamp() });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to update folder", ErrorType.UNKNOWN);
  }
}


