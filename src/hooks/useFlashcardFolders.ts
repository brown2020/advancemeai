import { useCallback, useEffect, useRef, useState } from "react";
import type { FlashcardFolder, FlashcardFolderId } from "@/types/flashcard-folder";
import type { UserId } from "@/types/common";
import {
  createFlashcardFolder,
  deleteFlashcardFolder,
  listFlashcardFolders,
  renameFlashcardFolder,
  setFlashcardFolderSetIds,
} from "@/services/flashcardFolderService";
import { useLoadingState } from "./useLoadingState";

export function useFlashcardFolders(userId: UserId | null | undefined) {
  const [folders, setFolders] = useState<FlashcardFolder[]>([]);
  const { isLoading, error, withLoading } = useLoadingState({ initialLoading: false });
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const data = await withLoading(
      () => listFlashcardFolders(userId),
      "Failed to load folders. Please try again."
    );
    if (isMountedRef.current) setFolders(data);
  }, [userId, withLoading]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!userId) {
      setFolders([]);
      return () => {
        isMountedRef.current = false;
      };
    }

    refresh().catch(() => {});
    return () => {
      isMountedRef.current = false;
    };
  }, [refresh, userId]);

  const createFolder = useCallback(
    async (name: string) => {
      if (!userId) return;
      await withLoading(
        () => createFlashcardFolder({ userId, name }),
        "Failed to create folder. Please try again."
      );
      await refresh();
    },
    [refresh, userId, withLoading]
  );

  const renameFolder = useCallback(
    async (folderId: FlashcardFolderId, name: string) => {
      if (!userId) return;
      await withLoading(
        () => renameFlashcardFolder({ userId, folderId, name }),
        "Failed to rename folder. Please try again."
      );
      await refresh();
    },
    [refresh, userId, withLoading]
  );

  const deleteFolder = useCallback(
    async (folderId: FlashcardFolderId) => {
      if (!userId) return;
      await withLoading(
        () => deleteFlashcardFolder({ userId, folderId }),
        "Failed to delete folder. Please try again."
      );
      await refresh();
    },
    [refresh, userId, withLoading]
  );

  const setFolderSetIds = useCallback(
    async (folderId: FlashcardFolderId, setIds: string[]) => {
      if (!userId) return;
      await withLoading(
        () => setFlashcardFolderSetIds({ userId, folderId, setIds }),
        "Failed to update folder. Please try again."
      );
      await refresh();
    },
    [refresh, userId, withLoading]
  );

  const addSetToFolder = useCallback(
    async (folderId: FlashcardFolderId, setId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return;
      const next = Array.from(new Set([...folder.setIds, setId]));
      await setFolderSetIds(folderId, next);
    },
    [folders, setFolderSetIds]
  );

  const removeSetFromFolder = useCallback(
    async (folderId: FlashcardFolderId, setId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return;
      const next = folder.setIds.filter((id) => id !== setId);
      await setFolderSetIds(folderId, next);
    },
    [folders, setFolderSetIds]
  );

  return {
    folders,
    isLoading,
    error,
    refresh,
    createFolder,
    renameFolder,
    deleteFolder,
    setFolderSetIds,
    addSetToFolder,
    removeSetFromFolder,
  };
}


